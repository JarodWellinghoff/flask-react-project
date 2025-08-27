# app/services/data_processing.py
"""Data processing utilities"""
import numpy as np

class DataProcessor:
    """Process and transform data for visualization"""
    
    @staticmethod
    def create_histogram(data, num_bins=20):
        """Create histogram bins from raw data"""
        if not data:
            return []
            
        min_val = min(data)
        max_val = max(data)
        bin_width = (max_val - min_val) / num_bins if max_val != min_val else 1
        
        bins = []
        for i in range(num_bins):
            bin_start = min_val + i * bin_width
            bin_end = bin_start + bin_width
            count = sum(1 for val in data if bin_start <= val < bin_end)
            bins.append({
                'range': f"{bin_start:.2f}-{bin_end:.2f}",
                'count': count,
                'start': bin_start,
                'end': bin_end
            })
        
        return bins
    
    @staticmethod
    def decimate_data(data, max_points=1000):
        """Reduce data points for performance"""
        if len(data) <= max_points:
            return data
            
        # Simple decimation - take every nth point
        step = len(data) // max_points
        return data[::step]
    
    @staticmethod
    def calculate_statistics(data):
        """Calculate basic statistics"""
        if not data:
            return {}
            
        return {
            'mean': np.mean(data),
            'std': np.std(data),
            'min': np.min(data),
            'max': np.max(data),
            'median': np.median(data),
            'q1': np.percentile(data, 25),
            'q3': np.percentile(data, 75)
        }