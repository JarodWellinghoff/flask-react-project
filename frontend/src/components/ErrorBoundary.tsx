// src/components/ErrorBoundary/ErrorBoundary.tsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
} from "@mui/icons-material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: "background.default",
          }}>
          <Card
            sx={{
              maxWidth: 600,
              width: "100%",
              boxShadow: 3,
            }}>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <ErrorIcon color='error' sx={{ fontSize: 64, mb: 2 }} />

              <Typography variant='h4' component='h1' gutterBottom>
                Something went wrong
              </Typography>

              <Alert severity='error' sx={{ mb: 3, textAlign: "left" }}>
                <Typography variant='body2'>
                  An unexpected error occurred while rendering this page. This
                  might be due to a network issue, invalid data, or a bug in the
                  application.
                </Typography>
              </Alert>

              <Button
                variant='contained'
                size='large'
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{ mb: 3 }}>
                Reload Page
              </Button>

              {/* Error Details (Expandable) */}
              {(this.state.error || this.state.errorInfo) && (
                <Accordion sx={{ textAlign: "left" }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ bgcolor: "grey.50" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BugReportIcon fontSize='small' color='error' />
                      <Typography variant='subtitle2'>
                        Error Details (for developers)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {this.state.error && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='error'
                          gutterBottom>
                          Error Message:
                        </Typography>
                        <Box
                          component='pre'
                          sx={{
                            bgcolor: "grey.100",
                            p: 1.5,
                            borderRadius: 1,
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                            overflowX: "auto",
                            border: "1px solid",
                            borderColor: "grey.300",
                          }}>
                          {this.state.error.toString()}
                        </Box>
                      </Box>
                    )}

                    {this.state.errorInfo && (
                      <Box>
                        <Typography
                          variant='subtitle2'
                          color='error'
                          gutterBottom>
                          Component Stack:
                        </Typography>
                        <Box
                          component='pre'
                          sx={{
                            bgcolor: "grey.100",
                            p: 1.5,
                            borderRadius: 1,
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                            overflowX: "auto",
                            border: "1px solid",
                            borderColor: "grey.300",
                            maxHeight: 200,
                            overflow: "auto",
                          }}>
                          {this.state.errorInfo.componentStack}
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Additional Actions */}
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                }}>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => window.history.back()}>
                  Go Back
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => (window.location.href = "/")}>
                  Home Page
                </Button>
              </Box>

              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 3, display: "block" }}>
                If this problem persists, please contact support with the error
                details above.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
