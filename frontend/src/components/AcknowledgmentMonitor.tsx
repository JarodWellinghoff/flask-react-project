// src/components/Debug/AcknowledgmentMonitor.tsx - Optional debug component with MUI
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Fade,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Clear as ClearIcon,
  Minimize as MinimizeIcon,
} from "@mui/icons-material";
import apiService from "../services/api";
import { API_CONFIG } from "@/src/utils/constants";

interface AcknowledgmentMonitorProps {
  taskId: string | null;
  isVisible?: boolean;
}

interface MessageInfo {
  messageId: string;
  type: string;
  timestamp: number;
  acknowledged: boolean;
}

export function AcknowledgmentMonitor({
  taskId,
  isVisible = false,
}: AcknowledgmentMonitorProps) {
  const [acknowledgedMessages, setAcknowledgedMessages] = useState<
    MessageInfo[]
  >([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isVisible || !taskId) return;

    setIsMonitoring(true);
    const messageIds = new Set<string>();

    // Listen for messages that require acknowledgment
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.requires_ack && data.message_id) {
          messageIds.add(data.message_id);

          // Track this message
          setAcknowledgedMessages((prev) => [
            ...prev,
            {
              messageId: data.message_id,
              type: data.type,
              timestamp: Date.now(),
              acknowledged: false,
            },
          ]);

          // Check acknowledgment status after a delay
          setTimeout(async () => {
            try {
              const status = await apiService.checkAcknowledgmentStatus(
                taskId,
                data.message_id
              );
              setAcknowledgedMessages((prev) =>
                prev.map((msg) =>
                  msg.messageId === data.message_id
                    ? { ...msg, acknowledged: status.acknowledged }
                    : msg
                )
              );
            } catch (error) {
              console.warn("Failed to check acknowledgment status:", error);
            }
          }, API_CONFIG.RETRY_DELAY);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    console.log("Acknowledgment monitoring enabled for task:", taskId);

    return () => {
      setIsMonitoring(false);
      setAcknowledgedMessages([]);
    };
  }, [taskId, isVisible]);

  if (!isVisible || !taskId) {
    return null;
  }

  const handleClear = () => {
    setAcknowledgedMessages([]);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Fade in={isVisible}>
      <Card
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: isMinimized ? 250 : 400,
          maxHeight: isMinimized ? 80 : 400,
          zIndex: 1300,
          boxShadow: 4,
          transition: "all 0.3s ease-in-out",
        }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: isMinimized ? 0 : 2,
            }}>
            <Typography variant='h6' sx={{ fontSize: "1rem", fontWeight: 600 }}>
              Acknowledgment Monitor
            </Typography>
            <IconButton
              size='small'
              onClick={handleToggleMinimize}
              sx={{ ml: 1 }}>
              <MinimizeIcon />
            </IconButton>
          </Box>

          {!isMinimized && (
            <Stack spacing={1.5}>
              {/* Task Info */}
              <Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'>
                  Task ID:
                </Typography>
                <Typography variant='body2' sx={{ fontFamily: "monospace" }}>
                  {taskId}
                </Typography>
              </Box>

              {/* Status */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  Status:
                </Typography>
                <Chip
                  size='small'
                  label={isMonitoring ? "Monitoring" : "Stopped"}
                  color={isMonitoring ? "success" : "default"}
                  variant='outlined'
                />
              </Box>

              {/* Messages */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ fontWeight: 600 }}>
                    Messages:
                  </Typography>
                  {acknowledgedMessages.length > 0 && (
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={handleClear}
                      startIcon={<ClearIcon />}
                      sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}>
                      Clear
                    </Button>
                  )}
                </Box>

                <Box
                  sx={{
                    maxHeight: 200,
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: 4,
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "grey.200",
                      borderRadius: 2,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "grey.400",
                      borderRadius: 2,
                    },
                  }}>
                  {acknowledgedMessages.length === 0 ? (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}>
                      No messages requiring acknowledgment yet
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {acknowledgedMessages.map((msg, index) => (
                        <Card
                          key={msg.messageId}
                          variant='outlined'
                          sx={{
                            p: 1,
                            bgcolor: msg.acknowledged
                              ? "success.50"
                              : "error.50",
                            borderColor: msg.acknowledged
                              ? "success.200"
                              : "error.200",
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}>
                            {msg.acknowledged ? (
                              <CheckCircleIcon
                                color='success'
                                fontSize='small'
                              />
                            ) : (
                              <ScheduleIcon color='warning' fontSize='small' />
                            )}
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 600, flex: 1 }}>
                              {msg.type}
                            </Typography>
                            <Chip
                              size='small'
                              label={msg.acknowledged ? "✓" : "⏳"}
                              color={msg.acknowledged ? "success" : "warning"}
                              variant='filled'
                              sx={{
                                minWidth: 28,
                                height: 20,
                                fontSize: "0.7rem",
                              }}
                            />
                          </Box>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ display: "block", fontSize: "0.7rem" }}>
                            {msg.messageId.slice(0, 8)}... •{" "}
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}
