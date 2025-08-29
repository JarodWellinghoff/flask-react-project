# scripts/log_monitor.py
"""Log analysis and monitoring script for Celery tasks"""
import json
import re
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import argparse

class LogAnalyzer:
    """Analyze Celery task logs"""
    
    def __init__(self, log_dir='logs'):
        self.log_dir = Path(log_dir)
        
    def parse_log_file(self, filename):
        """Parse a log file and return structured data"""
        log_file = self.log_dir / filename
        
        if not log_file.exists():
            print(f"Log file {log_file} not found")
            return []
        
        logs = []
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    # Try parsing as JSON (production logs)
                    log_entry = json.loads(line.strip())
                    logs.append(log_entry)
                except json.JSONDecodeError:
                    # Parse development format logs
                    log_entry = self.parse_development_log_line(line)
                    if log_entry:
                        logs.append(log_entry)
        
        return logs
    
    def parse_development_log_line(self, line):
        """Parse development format log line"""
        # Pattern: 2024-01-20 10:30:45 - app.tasks.batch_calculation - INFO - [12345678] Message
        pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - ([^-]+) - (\w+) - (.+)'
        match = re.match(pattern, line.strip())
        
        if match:
            timestamp_str, logger_name, level, message = match.groups()
            
            # Extract task ID if present
            task_id_match = re.search(r'\[([a-f0-9]{8})\]', message)
            task_id = task_id_match.group(1) if task_id_match else None
            
            return {
                'timestamp': timestamp_str,
                'logger': logger_name.strip(),
                'level': level,
                'message': message.strip(),
                'task_id': task_id
            }
        
        return None
    
    def analyze_task_performance(self, days=1):
        """Analyze task performance over the last N days"""
        logs = self.parse_log_file('tasks.log') + self.parse_log_file('tasks_dev.log')
        
        # Filter logs from last N days
        cutoff_time = datetime.now() - timedelta(days=days)
        recent_logs = []
        
        for log in logs:
            try:
                if isinstance(log['timestamp'], str):
                    timestamp = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                else:
                    timestamp = datetime.fromisoformat(log['timestamp'])
                
                if timestamp >= cutoff_time:
                    recent_logs.append(log)
            except (ValueError, KeyError):
                continue
        
        # Analyze task completion times
        task_durations = defaultdict(list)
        task_status = Counter()
        error_counts = Counter()
        
        for log in recent_logs:
            message = log.get('message', '')
            
            # Extract task completion info
            if 'completed successfully' in message and 'duration:' in message:
                duration_match = re.search(r'duration: ([\d.]+)s', message)
                if duration_match and 'task_name' in log:
                    duration = float(duration_match.group(1))
                    task_durations[log['task_name']].append(duration)
                    task_status[f"{log['task_name']}_completed"] += 1
            
            # Track errors
            elif log.get('level') == 'ERROR':
                if 'task_name' in log:
                    error_counts[log['task_name']] += 1
                task_status['errors'] += 1
        
        return {
            'task_durations': dict(task_durations),
            'task_status': dict(task_status),
            'error_counts': dict(error_counts),
            'total_logs_analyzed': len(recent_logs)
        }
    
    def generate_performance_report(self, days=7):
        """Generate a comprehensive performance report"""
        analysis = self.analyze_task_performance(days)
        
        print(f"=== Task Performance Report (Last {days} days) ===\n")
        print(f"Total logs analyzed: {analysis['total_logs_analyzed']}")
        print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Task duration analysis
        print("📊 TASK DURATION ANALYSIS:")
        print("-" * 40)
        for task_name, durations in analysis['task_durations'].items():
            if durations:
                avg_duration = sum(durations) / len(durations)
                min_duration = min(durations)
                max_duration = max(durations)
                
                print(f"  {task_name}:")
                print(f"    Executions: {len(durations)}")
                print(f"    Avg Duration: {avg_duration:.2f}s")
                print(f"    Min Duration: {min_duration:.2f}s")
                print(f"    Max Duration: {max_duration:.2f}s")
                print()
        
        # Task status summary
        print("✅ TASK STATUS SUMMARY:")
        print("-" * 40)
        for status, count in analysis['task_status'].items():
            print(f"  {status}: {count}")
        print()
        
        # Error analysis
        if analysis['error_counts']:
            print("❌ ERROR ANALYSIS:")
            print("-" * 40)
            for task_name, error_count in analysis['error_counts'].items():
                print(f"  {task_name}: {error_count} errors")
            print()
        
        # Calculate success rate
        total_completed = sum(count for status, count in analysis['task_status'].items() if 'completed' in status)
        total_errors = analysis['task_status'].get('errors', 0)
        total_tasks = total_completed + total_errors
        
        if total_tasks > 0:
            success_rate = (total_completed / total_tasks) * 100
            print(f"📈 OVERALL SUCCESS RATE: {success_rate:.1f}%")
            print(f"   ({total_completed} completed, {total_errors} failed out of {total_tasks} total)")
    
    def find_slow_tasks(self, threshold_seconds=60, days=7):
        """Find tasks that are running slower than threshold"""
        logs = self.parse_log_file('tasks.log') + self.parse_log_file('tasks_dev.log')
        
        slow_tasks = []
        cutoff_time = datetime.now() - timedelta(days=days)
        
        for log in logs:
            try:
                timestamp = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                if timestamp < cutoff_time:
                    continue
                
                message = log.get('message', '')
                duration_match = re.search(r'duration: ([\d.]+)s', message)
                
                if duration_match:
                    duration = float(duration_match.group(1))
                    if duration > threshold_seconds:
                        slow_tasks.append({
                            'task_name': log.get('task_name', 'unknown'),
                            'task_id': log.get('task_id', 'unknown'),
                            'duration': duration,
                            'timestamp': timestamp
                        })
                        
            except (ValueError, KeyError):
                continue
        
        return sorted(slow_tasks, key=lambda x: x['duration'], reverse=True)
    
    def find_frequent_errors(self, days=7, min_occurrences=2):
        """Find frequently occurring errors"""
        logs = self.parse_log_file('errors.log') + self.parse_log_file('tasks_dev.log')
        
        error_patterns = Counter()
        error_details = defaultdict(list)
        cutoff_time = datetime.now() - timedelta(days=days)
        
        for log in logs:
            if log.get('level') != 'ERROR':
                continue
                
            try:
                timestamp = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                if timestamp < cutoff_time:
                    continue
                
                message = log.get('message', '')
                
                # Extract error pattern (first part of error message)
                error_pattern = message.split(':')[0] if ':' in message else message[:50]
                error_patterns[error_pattern] += 1
                error_details[error_pattern].append({
                    'timestamp': timestamp,
                    'task_id': log.get('task_id', 'unknown'),
                    'full_message': message
                })
                
            except (ValueError, KeyError):
                continue
        
        # Filter by minimum occurrences
        frequent_errors = {
            pattern: {'count': count, 'details': error_details[pattern]}
            for pattern, count in error_patterns.items()
            if count >= min_occurrences
        }
        
        return frequent_errors

def main():
    parser = argparse.ArgumentParser(description='Analyze Celery task logs')
    parser.add_argument('--log-dir', default='logs', help='Log directory path')
    parser.add_argument('--days', type=int, default=7, help='Number of days to analyze')
    parser.add_argument('--report', action='store_true', help='Generate performance report')
    parser.add_argument('--slow-tasks', type=int, metavar='SECONDS', 
                       help='Find tasks slower than N seconds')
    parser.add_argument('--errors', action='store_true', help='Find frequent errors')
    
    args = parser.parse_args()
    
    analyzer = LogAnalyzer(args.log_dir)
    
    if args.report:
        analyzer.generate_performance_report(args.days)
    
    if args.slow_tasks:
        print(f"\n🐌 SLOW TASKS (>{args.slow_tasks}s):")
        print("-" * 50)
        slow_tasks = analyzer.find_slow_tasks(args.slow_tasks, args.days)
        
        if slow_tasks:
            for task in slow_tasks[:10]:  # Show top 10
                print(f"  {task['task_name']} ({task['task_id'][:8]})")
                print(f"    Duration: {task['duration']:.2f}s")
                print(f"    Time: {task['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}")
                print()
        else:
            print("  No slow tasks found!")
    
    if args.errors:
        print(f"\n🔥 FREQUENT ERRORS (last {args.days} days):")
        print("-" * 50)
        frequent_errors = analyzer.find_frequent_errors(args.days)
        
        if frequent_errors:
            for pattern, info in frequent_errors.items():
                print(f"  Error: {pattern}")
                print(f"  Occurrences: {info['count']}")
                print(f"  Latest: {info['details'][0]['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}")
                print()
        else:
            print("  No frequent errors found!")

if __name__ == '__main__':
    main()