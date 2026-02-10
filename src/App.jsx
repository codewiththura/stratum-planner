/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

// --- MUI Imports ---
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Fab,
  Card,
  CardContent,
  CardActionArea,
  Box,
  TextField,
  Chip,
  LinearProgress,
  Avatar,
  Paper,
  Stack,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  Slide,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Container,
  Divider,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
} from "@mui/material";

// --- Icons ---
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Google as GoogleIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as CircleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Assessment as BarChartIcon,
  Sort as SortIcon,
  Block as BlockIcon,
  Task as TaskIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  Home as HomeIcon,
  HourglassBottom as HourglassBottomIcon,
  History as HistoryIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);

// --- Theme ---
const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },
    secondary: { main: "#64748b" },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h6: { fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
    caption: { fontSize: "0.75rem", fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        sizeSmall: { height: 24, fontSize: "0.7rem" },
      },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 50 } },
    },
    MuiFab: {
      styleOverrides: {
        root: { boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)" },
      },
    },
  },
});

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: { main: "#3b82f6" }, // Slightly brighter blue for dark mode visibility
    secondary: { main: mode === "light" ? "#64748b" : "#94a3b8" },
    background: {
      default: mode === "light" ? "#f8fafc" : "#0f172a", // Deep Navy background
      paper: mode === "light" ? "#ffffff" : "#1e293b", // Lighter Navy for cards
    },
    text: {
      primary: mode === "light" ? "#0f172a" : "#f8fafc",
      secondary: mode === "light" ? "#64748b" : "#94a3b8",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h6: { fontWeight: 700, fontSize: "1.1rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === "light" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
          border: mode === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#ffffff" : "#0f172a",
          borderBottom:
            mode === "light" ? "1px solid #e2e8f0" : "1px solid #1e293b",
        },
      },
    },
  },
});

const STATUS = {
  NOT_YET: "not_yet",
  PENDING: "pending",
  FINISHED: "finished",
  CANCELED: "canceled",
};

// --- Helpers ---
const getDaysLeft = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(endDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return { label: `${Math.abs(diffDays)}d Overdue`, color: "error" };
  if (diffDays === 0) return { label: "Due Today", color: "warning" };
  if (diffDays === 1) return { label: "Due Tomorrow", color: "warning" };
  if (diffDays <= 3)
    return { label: `${diffDays} days left`, color: "warning" };
  return { label: `${diffDays} days left`, color: "success" };
};

const formatTo12Hour = (timeStr) => {
  if (!timeStr) return "--:--";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));

  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

const calculateDuration = (start, end) => {
  if (!start || !end) return null;

  const startTime = new Date(`2026-01-01T${start}`);
  const endTime = new Date(`2026-01-01T${end}`);

  let diff = (endTime - startTime) / 1000 / 60;
  if (diff < 0) diff += 24 * 60;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  let result = "";
  if (hours > 0) result += `${hours} hr `;
  if (minutes > 0) result += `${minutes} min`;

  return result.trim() || "0 min";
};

const DeleteConfirmDialog = ({ open, onClose, onConfirm }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{"Delete this plan?"}</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        This action cannot be undone. The plan and all its tasks will be
        permanently removed.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const clampDate = (dateStr, minDate, maxDate) => {
  if (!dateStr || !minDate || !maxDate) return dateStr;
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
};

const SharedHeader = ({ title, user }) => (
  <AppBar position="sticky" color="default" elevation={0}>
    <Toolbar sx={{ py: 0.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: "primary.main",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mr: 2,
          boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
        }}
      >
        <BarChartIcon sx={{ color: "white", fontSize: 24 }} />
      </Box>
      <Typography
        variant="h6"
        fontWeight="500"
        sx={{ flexGrow: 1, color: "text.primary", letterSpacing: -0.5 }}
      >
        {title}
      </Typography>
      <Avatar src={user?.photoURL} sx={{ width: 32, height: 32 }} />
    </Toolbar>
  </AppBar>
);

const LoginView = () => (
  <Box
    sx={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      p: 4,
    }}
  >
    <Box sx={{ p: 2, bgcolor: "primary.main", borderRadius: 4, mb: 3 }}>
      <BarChartIcon sx={{ fontSize: 40, color: "white" }} />
    </Box>
    <Typography variant="h5" fontWeight="800" gutterBottom>
      Stratum - The Action Planner
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      sx={{ mb: 6, maxWidth: 300 }}
    >
      Professional goal tracker that breaks big ambitions into scheduled
      sub-actions.
    </Typography>
    <Fab
      variant="extended"
      color="primary"
      onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
      sx={{ px: 4 }}
    >
      <GoogleIcon sx={{ mr: 1 }} /> Continue with Google
    </Fab>
  </Box>
);

const SortDrawer = ({
  open,
  onClose,
  sortConfig,
  setSortConfig,
  title,
  options,
}) => {
  // Fallback to dashboard options if none provided
  const displayOptions = options || [
    { label: "Start Date", key: "startDate", icon: <EventIcon /> },
    { label: "Progress Level", key: "progress", icon: <BarChartIcon /> },
    {
      label: "Urgency (Days Left)",
      key: "daysLeft",
      icon: <AccessTimeFilledIcon />,
    },
    { label: "Number of Tasks", key: "actions", icon: <TaskIcon /> },
  ];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, p: 2, pb: 4 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
        <Typography
          variant="subtitle1"
          fontWeight="600"
          sx={{ mb: 2, textAlign: "center" }}
        >
          {title || "Sort By"}
        </Typography>

        <List sx={{ mb: 2 }}>
          {displayOptions.map((option) => (
            <ListItem key={option.key} disablePadding>
              <ListItemButton
                selected={sortConfig.key === option.key}
                onClick={() =>
                  setSortConfig({ ...sortConfig, key: option.key })
                }
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      sortConfig.key === option.key
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  {option.icon || <SortIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={option.label}
                  primaryTypographyProps={{
                    fontWeight: sortConfig.key === option.key ? 700 : 500,
                  }}
                />
                {sortConfig.key === option.key && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mb: 2 }} />
        <Typography
          variant="caption"
          fontWeight="700"
          color="text.secondary"
          sx={{ display: "block", mb: 1, ml: 1 }}
        >
          ORDER
        </Typography>
        <ToggleButtonGroup
          value={sortConfig.direction}
          exclusive
          fullWidth
          onChange={(_, dir) =>
            dir && setSortConfig({ ...sortConfig, direction: dir })
          }
          size="small"
        >
          <ToggleButton value="asc">Ascending</ToggleButton>
          <ToggleButton value="desc">Descending</ToggleButton>
        </ToggleButtonGroup>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{ mt: 3, py: 1.5 }}
        >
          Done
        </Button>
      </Box>
    </Drawer>
  );
};

const HomeView = ({
  user,
  plans,
  setView,
  setSelectedPlanId,
  sortConfig,
  setSortConfig,
}) => {
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  const sortLabels = {
    startDate: "Start Date",
    progress: "Progress",
    daysLeft: "Urgency",
    actions: "Tasks",
  };

  const isFiltered = sortConfig.key !== "startDate";

  return (
    <Box
      sx={{
        pb: "calc(80px + env(safe-area-inset-bottom))",
        minHeight: "100vh",
      }}
    >
      <SharedHeader title="Dashboard" user={user} />
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3, px: 1 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: "text.disabled",
              textTransform: "uppercase",
            }}
          >
            {plans.length} {plans.length === 1 ? "Active Plan" : "Active Plans"}
          </Typography>

          <Button
            variant={isFiltered ? "soft" : "text"}
            onClick={() => setIsSortOpen(true)}
            size="small"
            startIcon={<SortIcon />}
            sx={{
              color: "primary.main",
              borderRadius: "10px",
              fontWeight: 500,
            }}
          >
            {sortLabels[sortConfig.key]} ({sortConfig.direction.toUpperCase()})
          </Button>
        </Stack>
        <Stack spacing={2}>
          {plans.map((plan) => {
            const daysMeta = getDaysLeft(plan.endDate);
            const doneCount = plan.actions.filter(
              (a) => a.status === STATUS.FINISHED,
            ).length;
            const activeCount = plan.actions.filter(
              (a) => a.status === STATUS.PENDING,
            ).length;
            const todoCount = plan.actions.filter(
              (a) => a.status === STATUS.NOT_YET,
            ).length;
            const validActions = plan.actions.filter(
              (a) => a.status !== STATUS.CANCELED,
            );
            const total = validActions.length;
            const progress = total > 0 ? (doneCount / total) * 100 : 0;
            const previewActions = plan.actions.slice(0, 3);
            const remainingActions = total - 3;

            const canceledCount = plan.actions.filter(
              (a) => a.status === STATUS.CANCELED,
            ).length;

            return (
              <Card key={plan.id} elevation={0}>
                <CardActionArea
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setView("detail");
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Box sx={{ pr: 1, flex: 1 }}>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          sx={{ lineHeight: 1.2 }}
                        >
                          {plan.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={daysMeta.label}
                        color={
                          daysMeta.color === "success"
                            ? "default"
                            : daysMeta.color
                        }
                        size="small"
                        sx={{
                          fontWeight: 700,
                          flexShrink: 0,
                          bgcolor:
                            daysMeta.color === "success"
                              ? "#f1f5f9"
                              : undefined,
                          color:
                            daysMeta.color === "success"
                              ? "#64748b"
                              : undefined,
                        }}
                      />
                    </Stack>

                    <Box sx={{ mb: 3 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="600"
                          color="text.secondary"
                        >
                          Overall Progress
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="primary"
                        >
                          {Math.round(progress)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "#f1f5f9" }}
                        color={progress === 100 ? "success" : "primary"}
                      />
                    </Box>

                    <Stack spacing={1} mb={2.5}>
                      {previewActions.map((action, idx) => {
                        let StatusIcon = CircleIcon;
                        let color = "text.disabled";
                        if (action.status === STATUS.FINISHED) {
                          StatusIcon = CheckCircleIcon;
                          color = "success.main";
                        }
                        if (action.status === STATUS.PENDING) {
                          StatusIcon = AccessTimeIcon;
                          color = "warning.main";
                        }
                        return (
                          <Stack
                            key={idx}
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                          >
                            <StatusIcon sx={{ fontSize: 16, color: color }} />
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                color:
                                  action.status === STATUS.FINISHED
                                    ? "text.secondary"
                                    : "text.primary",
                                textDecoration:
                                  action.status === STATUS.FINISHED
                                    ? "line-through"
                                    : "none",
                                flex: 1,
                              }}
                            >
                              {action.title || action.name}
                            </Typography>
                          </Stack>
                        );
                      })}
                      {remainingActions > 0 && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ pl: 3.5, fontWeight: 600 }}
                        >
                          + {remainingActions} more items
                        </Typography>
                      )}
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: "100%", px: 0.5 }}
                      divider={
                        <Typography
                          variant="caption"
                          sx={{ color: "divider", fontWeight: 300, mx: 0.5 }}
                        >
                          |
                        </Typography>
                      }
                    >
                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="text.disabled"
                      >
                        {doneCount} Done
                      </Typography>

                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="text.disabled"
                      >
                        {activeCount} Active
                      </Typography>

                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="text.disabled"
                      >
                        {todoCount} To Do
                      </Typography>

                      {canceledCount > 0 && (
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          color="text.disabled"
                        >
                          {canceledCount} Canceled
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      </Container>
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 85, right: 20 }}
        onClick={() => {
          setSelectedPlanId(null);
          setView("create");
        }}
      >
        <AddIcon />
      </Fab>
      <SortDrawer
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        title="Sort Plans By"
        options={[
          { label: "Start Date", key: "startDate", icon: <EventIcon /> },
          { label: "Progress Level", key: "progress", icon: <BarChartIcon /> },
          {
            label: "Urgency (Days Left)",
            key: "daysLeft",
            icon: <AccessTimeFilledIcon />,
          },
          { label: "Number of Tasks", key: "actions", icon: <TaskIcon /> },
        ]}
      />
    </Box>
  );
};

const StatItem = ({ label, value, color }) => (
  <Box sx={{ textAlign: "center", flex: 1 }}>
    <Typography
      variant="caption"
      fontWeight="700"
      color="text.secondary"
      display="block"
      pb={0.6}
      sx={{ textTransform: "uppercase", fontSize: "0.6rem" }}
    >
      {label}
    </Typography>
    <Typography
      variant="h6"
      fontWeight="800"
      sx={{ color: color, lineHeight: 1 }}
    >
      {value}
    </Typography>
  </Box>
);

const DetailView = ({ plan, setView, onRequestDelete, updateStatus }) => {
  if (!plan) return null;
  const totalActions = plan.actions.length;
  const doneCount = plan.actions.filter(
    (a) => a.status === STATUS.FINISHED,
  ).length;
  const pendingCount = plan.actions.filter(
    (a) => a.status === STATUS.PENDING,
  ).length;
  const todoCount = plan.actions.filter(
    (a) => a.status === STATUS.NOT_YET,
  ).length;
  const canceledCount = plan.actions.filter(
    (a) => a.status === STATUS.CANCELED,
  ).length;

  const validActionsCount = totalActions - canceledCount;
  const progress =
    validActionsCount > 0 ? (doneCount / validActionsCount) * 100 : 0;
  const daysMeta = getDaysLeft(plan.endDate);

  return (
    <Box
      sx={{
        pb: "calc(80px + env(safe-area-inset-bottom))",
        minHeight: "100vh",
      }}
    >
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setView("home")}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setView("edit")}>
            <EditIcon />
          </IconButton>

          <IconButton color="error" onClick={() => onRequestDelete(plan.id)}>
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {plan.title}
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            spacing={2}
            mb={2}
          >
            <Typography
              size="small"
              sx={{ color: "text.secondary", fontSize: 14 }}
            >
              {`${new Date(plan.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${new Date(plan.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
            </Typography>
            <Chip
              label={daysMeta.label}
              size="small"
              variant="filled"
              color={daysMeta.color === "success" ? "success" : daysMeta.color}
              sx={{ fontWeight: 700 }}
            />
            <Typography
              variant="caption"
              fontWeight="bold"
              color="primary"
              sx={{ ml: "auto !important" }}
            >
              {Math.round(progress)}% Complete
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4, my: 3 }}
          />
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 3,
              bgcolor: "action.hover",
              borderStyle: "dashed",
            }}
          >
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              spacing={1}
              justifyContent="space-around"
            >
              <StatItem
                label="Total"
                color="text.disabled"
                value={totalActions}
              />
              <StatItem label="Done" value={doneCount} color="text.disabled" />
              <StatItem
                label="Active"
                color="text.disabled"
                value={pendingCount}
              />
              <StatItem
                label="Canceled"
                value={canceledCount}
                color="text.disabled"
              />
            </Stack>
          </Paper>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1 }}
          >
            Execution List
          </Typography>

          {/* <Chip
            label={`${plan.actions.length} ${plan.actions.length === 1 ? "Action" : "Actions"}`}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 700,
              fontSize: "0.65rem",
              bgcolor: "#f8fafc",
              color: "text.secondary",
              border: "1px dashed #cbd5e1",
            }}
          /> */}
        </Box>

        <List sx={{ width: "100%", p: 0 }}>
          {plan.actions.map((action, idx) => {
            const isDone = action.status === STATUS.FINISHED;
            return (
              <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                <ListItemIcon
                  sx={{ minWidth: 40 }}
                  onClick={() => updateStatus(plan.id, idx, action.status)}
                >
                  {isDone ? (
                    <CheckCircleIcon color="success" />
                  ) : action.status === STATUS.PENDING ? (
                    <AccessTimeIcon color="warning" />
                  ) : action.status === STATUS.CANCELED ? (
                    <BlockIcon sx={{ color: "text.disabled" }} />
                  ) : (
                    <CircleIcon color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      fontWeight="500"
                      sx={{
                        textDecoration:
                          action.status === STATUS.FINISHED
                            ? "line-through"
                            : "none",
                        color:
                          action.status === STATUS.FINISHED ||
                          action.status == STATUS.CANCELED
                            ? "text.disabled"
                            : "text.primary",
                      }}
                    >
                      {action.title || action.name}
                    </Typography>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 0.5 }}>
                      {action.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontStyle: "italic",
                            color: "text.secondary",
                            pl: 1,
                            borderLeft: "2px solid",
                            borderColor: "divider",
                            mt: 0.5,
                            display: "block",
                          }}
                        >
                          {action.description}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{ mt: 1 }}
                      >
                        <EventIcon sx={{ fontSize: 12 }} />
                        <Typography
                          variant="caption"
                          fontWeight="500"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {action.endDate ? (
                            `${new Date(action.startDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )} - ${new Date(action.endDate).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}`
                          ) : (
                            <>
                              {new Date(action.startDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                              {action.startTime && (
                                <Box
                                  component="span"
                                  sx={{
                                    ml: 0.5,
                                    color: "text.secondary",
                                    fontWeight: 500,
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {" "}
                                  {action.endTime ? (
                                    <>
                                      <HourglassBottomIcon
                                        sx={{
                                          fontSize: 12,
                                          mx: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      {calculateDuration(
                                        action.startTime,
                                        action.endTime,
                                      )}
                                    </>
                                  ) : (
                                    action.startTime
                                  )}
                                </Box>
                              )}
                            </>
                          )}
                        </Typography>
                      </Stack>

                      {action.status === STATUS.FINISHED &&
                        action.actualDate && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ mt: 0.5 }}
                          >
                            <Typography variant="caption" fontWeight="300">
                              Completed:{" "}
                              {new Date(action.actualDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}{" "}
                              • {formatTo12Hour(action.actualTime)}
                            </Typography>
                          </Stack>
                        )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItem>
            );
          })}
        </List>
      </Container>
    </Box>
  );
};

const FormView = ({
  user,
  plans,
  selectedPlanId,
  setSelectedPlanId,
  setView,
  isSaving,
  setIsSaving,
  showMessage,
}) => {
  const existing = plans.find((p) => p.id === selectedPlanId);

  const [taskToDelete, setTaskToDelete] = useState(null);

  const [formData, setFormData] = useState(() => {
    if (existing) return existing;
    return {
      title: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      actions: [
        {
          id: Date.now(),
          title: "",
          status: STATUS.NOT_YET,
          description: "",
          dateType: "range",
          startDate: "",
          endDate: "",
          specificDate: "",
          duration: "",
        },
      ],
    };
  });

  const isDirty = React.useMemo(() => {
    if (existing) {
      return JSON.stringify(formData) !== JSON.stringify(existing);
    } else {
      return (
        formData.title.trim() !== "" ||
        formData.actions.some((a) => a.title.trim() !== "") ||
        formData.endDate !== ""
      );
    }
  }, [formData, existing]);

  const updateActionField = (index, fieldOrUpdates, value) => {
    setFormData((prev) => {
      const newActions = [...prev.actions];
      const currentAction = { ...newActions[index] };

      if (typeof fieldOrUpdates === "object") {
        newActions[index] = { ...currentAction, ...fieldOrUpdates };
      } else {
        let finalValue = value;

        if (["startDate", "endDate", "specificDate"].includes(fieldOrUpdates)) {
          finalValue = clampDate(value, prev.startDate, prev.endDate);
        }

        newActions[index] = { ...currentAction, [fieldOrUpdates]: finalValue };
      }

      return { ...prev, actions: newActions };
    });
  };

  const addActionField = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          id: Date.now(),
          title: "",
          status: STATUS.NOT_YET,
          description: "",
          dateType: "range",
        },
      ],
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.endDate) {
      showMessage("Please provide a Title and Deadline.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const cleanActions = formData.actions
        .filter((a) => a.title.trim())
        .map((a) => ({
          ...a,
          name: a.title,
          status: a.status || STATUS.NOT_YET,
        }));
      const payload = {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        actions: cleanActions,
        ownerId: user.uid,
      };
      if (existing) {
        await updateDoc(
          doc(db, "users", user.uid, "plans", existing.id),
          payload,
        );
        showMessage("Plan updated successfully", "success");
      } else {
        const docRef = await addDoc(
          collection(db, "users", user.uid, "plans"),
          { ...payload, createdAt: new Date().toISOString() },
        );
        setSelectedPlanId(docRef.id);
        showMessage("New plan created!", "success");
      }
      setView("detail");
      setTimeout(() => setIsSaving(false), 100);
    } catch (error) {
      console.error("Error saving plan:", error);
      showMessage("Failed to save changes. Please try again.", "error");
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteTask = () => {
    if (taskToDelete === null) return;
    const newActions = formData.actions.filter((_, i) => i !== taskToDelete);
    setFormData({ ...formData, actions: newActions });
    setTaskToDelete(null);
  };

  const inputIconStyles = {
    "& .MuiInputBase-input::-webkit-calendar-picker-indicator": {
      filter: (theme) =>
        theme.palette.mode === "dark" ? "invert(1) brightness(100%)" : "none",
      cursor: "pointer",
    },
  };

  return (
    <Dialog
      fullScreen
      open={true}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{
        sx: { bgcolor: "background.default", backgroundImage: "none" },
      }}
    >
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              setIsSaving(false);
              setView(existing ? "detail" : "home");
            }}
            disabled={isSaving}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            {existing ? "Edit Plan" : "New Plan"}
          </Typography>
          {/* <IconButton color="primary" onClick={handleSave} disabled={isSaving}>
            <CheckCircleIcon />
          </IconButton> */}
        </Toolbar>
      </AppBar>
      {isSaving ? (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pb: 10,
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography
            variant="h6"
            sx={{ mt: 3, color: "text.secondary", fontWeight: 500 }}
          >
            {existing ? "Updating plan..." : "Creating plan..."}
          </Typography>
        </Box>
      ) : (
        <>
          <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
            <Stack spacing={3}>
              <TextField
                label="Goal / Title"
                fullWidth
                variant="standard"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                InputProps={{ style: { fontSize: "1.25rem", fontWeight: 600 } }}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  type="date"
                  label="Start"
                  fullWidth
                  value={formData.startDate}
                  sx={inputIconStyles}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  label="Deadline"
                  fullWidth
                  value={formData.endDate}
                  sx={inputIconStyles}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">
                ACTION TASKS
              </Typography>
              {formData.actions.map((action, idx) => {
                const scheduleMode =
                  action.startTime || action.endTime ? "time" : "range";

                return (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      mb: 2,
                      borderRadius: 3,
                      bgcolor: "background.paper",
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <CircleIcon fontSize="small" color="disabled" />
                      <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Task name..."
                        value={action.title}
                        onChange={(e) =>
                          updateActionField(idx, "title", e.target.value)
                        }
                        InputProps={{
                          disableUnderline: false,
                          sx: { fontWeight: 600 },
                        }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setTaskToDelete(idx)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 1,
                        mr: 1,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={scheduleMode === "time"}
                            onChange={(e) => {
                              const mode = e.target.checked ? "time" : "range";
                              if (mode === "range") {
                                updateActionField(idx, {
                                  startTime: "",
                                  endTime: "",
                                });
                              } else {
                                updateActionField(idx, {
                                  endDate: "",
                                  startTime: "09:00",
                                });
                              }
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: "text.secondary" }}
                          >
                            {scheduleMode === "time"
                              ? "Time Slot"
                              : "Date Range"}
                          </Typography>
                        }
                        labelPlacement="start"
                      />
                    </Box>

                    <Stack spacing={2}>
                      <TextField
                        type="date"
                        label="Date"
                        fullWidth
                        size="small"
                        sx={inputIconStyles}
                        value={action.startDate || ""}
                        inputProps={{
                          min: formData.startDate,
                          max: formData.endDate,
                        }}
                        onChange={(e) =>
                          updateActionField(idx, "startDate", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />

                      {scheduleMode === "range" ? (
                        <TextField
                          type="date"
                          label="End Date"
                          fullWidth
                          size="small"
                          sx={inputIconStyles}
                          value={action.endDate || ""}
                          inputProps={{
                            min: action.startDate || formData.startDate,
                            max: formData.endDate,
                          }}
                          onChange={(e) =>
                            updateActionField(idx, "endDate", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      ) : (
                        <Stack direction="row" spacing={2}>
                          <TextField
                            type="time"
                            label="From"
                            fullWidth
                            size="small"
                            sx={inputIconStyles}
                            value={action.startTime || ""}
                            onChange={(e) =>
                              updateActionField(
                                idx,
                                "startTime",
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            type="time"
                            label="To"
                            fullWidth
                            size="small"
                            sx={inputIconStyles}
                            value={action.endTime || ""}
                            onChange={(e) =>
                              updateActionField(idx, "endTime", e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Stack>
                      )}

                      <TextField
                        placeholder="Notes..."
                        fullWidth
                        variant="standard"
                        size="small"
                        multiline
                        mt={1}
                        value={action.description || ""}
                        onChange={(e) =>
                          updateActionField(idx, "description", e.target.value)
                        }
                      />
                    </Stack>

                    {action.status === STATUS.FINISHED && (
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          sx={{ mb: 2, display: "block" }}
                        >
                          COMPLETION (LOGGED)
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            type="date"
                            label="Actual Date"
                            fullWidth
                            sx={inputIconStyles}
                            size="small"
                            value={action.actualDate || ""}
                            onChange={(e) =>
                              updateActionField(
                                idx,
                                "actualDate",
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            type="time"
                            label="Actual Time"
                            fullWidth
                            sx={inputIconStyles}
                            size="small"
                            value={action.actualTime || ""}
                            onChange={(e) =>
                              updateActionField(
                                idx,
                                "actualTime",
                                e.target.value,
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                );
              })}
              <Button
                startIcon={<AddIcon />}
                onClick={addActionField}
                variant="outlined"
                sx={{ borderStyle: "dashed", justifyContent: "flex-start" }}
              >
                Add Task
              </Button>
            </Stack>
          </Container>
          <Paper
            elevation={4}
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              pb: { xs: "calc(25px + env(safe-area-inset-bottom))", sm: 0 },
              display: "flex",
              justifyContent: "center",
              bgcolor: "background.paper",
              backgroundImage: "none",
              borderTop: 1,
              borderColor: "divider",
              zIndex: 100,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSave}
              sx={{ maxWidth: 400 }}
              disabled={isSaving || !isDirty}
            >
              {existing ? "Update Plan" : "Save Plan"}
            </Button>
          </Paper>
        </>
      )}

      {/* Task Deletion Confirmation */}
      <Dialog
        open={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "
            {formData.actions[taskToDelete]?.title || "this task"}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTaskToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteTask}
            color="error"
            variant="contained"
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const ProfileView = ({ user, handleLogout, mode, setMode }) => (
  <Box
    sx={{
      p: 4,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <Avatar src={user.photoURL} sx={{ width: 80, height: 80, mb: 2 }} />
    <Typography variant="h6" color="text.primary">
      {user.displayName}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
      {user.email}
    </Typography>

    <Paper
      variant="outlined"
      sx={{ width: "100%", maxWidth: 360, borderRadius: 4, overflow: "hidden" }}
    >
      <List disablePadding>
        <ListItem sx={{ py: 2 }}>
          <ListItemIcon>
            {mode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          <ListItemText
            primary="Appearance"
            secondary={mode === "dark" ? "Dark Mode" : "Light Mode"}
          />
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(e, val) => val && setMode(val)}
          >
            <ToggleButton value="light">
              <LightModeIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </ListItem>
        <Divider />
        <ListItemButton
          onClick={handleLogout}
          sx={{ color: "error.main", py: 2 }}
        >
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </List>
    </Paper>
  </Box>
);

const HistoryView = ({ user, plans, setView }) => {
  const [historySort, setHistorySort] = useState({
    key: "actualDate",
    direction: "asc", // Default: Completion Date (ASC)
  });
  const [isSortOpen, setIsSortOpen] = useState(false);

  const historySortLabels = {
    actualDate: "Completion Date",
    actualDays: "Actual Taken",
  };

  const completedTasks = React.useMemo(() => {
    let tasks = [];
    plans.forEach((plan) => {
      plan.actions.forEach((action) => {
        if (action.status === STATUS.FINISHED) {
          tasks.push({ ...action, planTitle: plan.title });
        }
      });
    });

    return tasks.sort((a, b) => {
      let valA, valB;
      if (historySort.key === "actualDate") {
        valA = new Date(`${a.actualDate}T${a.actualTime || "00:00"}`).getTime();
        valB = new Date(`${b.actualDate}T${b.actualTime || "00:00"}`).getTime();
      } else {
        const getDays = (t) => {
          const start = new Date(t.startDate);
          const end = new Date(t.actualDate);
          return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        };
        valA = getDays(a);
        valB = getDays(b);
      }

      if (valA < valB) return historySort.direction === "asc" ? -1 : 1;
      if (valA > valB) return historySort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [plans, historySort]);

  return (
    <Box
      sx={{
        pb: "calc(80px + env(safe-area-inset-bottom))",
        minHeight: "100vh",
      }}
    >
      <SharedHeader title="Completed Actions" user={user} />
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3, px: 1 }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontWeight: 500 }}
          >
            {completedTasks.length} RECORDS
          </Typography>
          <Button
            onClick={() => setIsSortOpen(true)}
            size="small"
            startIcon={<SortIcon />}
            sx={{ fontWeight: 500, color: "primary.main" }}
          >
            {historySortLabels[historySort.key]} (
            {historySort.direction.toUpperCase()})
          </Button>
        </Stack>

        {completedTasks.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 10, px: 4 }}>
            <HistoryIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight="700">
              No records yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {completedTasks.map((task, index) => {
              const start = new Date(task.startDate || new Date());
              const plannedEnd = task.endDate ? new Date(task.endDate) : start;
              const actualEnd = new Date(task.actualDate || new Date());

              const plannedDays = Math.max(
                1,
                Math.ceil((plannedEnd - start) / (1000 * 60 * 60 * 24)) + 1,
              );

              const actualDays = Math.max(
                1,
                Math.ceil((actualEnd - start) / (1000 * 60 * 60 * 24)) + 1,
              );

              const diffInMs = plannedEnd.getTime() - actualEnd.getTime();
              const daysDiff = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

              let status = "on-time";
              if (daysDiff > 0) status = "ahead";
              else if (daysDiff < 0) status = "behind";

              const absDiff = Math.abs(daysDiff);

              return (
                <Paper
                  variant="outlined"
                  key={index}
                  sx={{ mb: 2, borderRadius: 3, p: 2 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="700"
                    display="block"
                    mb={0.5}
                    sx={{ ml: 0.1 }}
                  >
                    {task.planTitle}
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="800"
                    gutterBottom
                    sx={{ ml: 0.1 }}
                  >
                    {task.title}
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <EventIcon
                        sx={{ fontSize: 12, color: "text.disabled" }}
                      />
                      <Typography
                        variant="caption"
                        fontWeight="500"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        {task.endDate
                          ? `${new Date(task.startDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )} - ${new Date(task.endDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}`
                          : `${new Date(task.startDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}`}
                        {task.startTime && (
                          <Box
                            component="span"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              ml: 0.5,
                            }}
                          >
                            <HourglassBottomIcon
                              sx={{
                                fontSize: 12,
                                mx: 0.5,
                                color: "text.disabled",
                              }}
                            />
                            {task.endTime
                              ? calculateDuration(task.startTime, task.endTime)
                              : formatTo12Hour(task.startTime)}
                          </Box>
                        )}
                      </Typography>
                    </Stack>
                    <Box>
                      <Chip
                        size="small"
                        label={`Completed: ${new Date(
                          task.actualDate,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })} • ${formatTo12Hour(task.actualTime)}`}
                        sx={{
                          bgcolor: "#edf7ed",
                          color: "#1e4620",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                        bgcolor: "action.hover",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          fontWeight="500"
                        >
                          PLANNED
                        </Typography>
                        <Typography variant="body2" fontWeight="700">
                          {plannedDays} Days
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          borderLeft: "1px solid",
                          borderColor: "divider",
                          pl: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          fontWeight="500"
                        >
                          ACTUAL TAKEN
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="700"
                          color={
                            status === "ahead"
                              ? "success.main"
                              : status === "behind"
                                ? "error.main"
                                : "text.primary"
                          }
                        >
                          {actualDays} {actualDays === 1 ? "Day" : "Days"}{" "}
                          {status === "ahead" && (
                            <Box
                              component="span"
                              sx={{
                                fontSize: "0.7rem",
                                opacity: 0.5,
                                color: "text.primary",
                                fontWeight: 500,
                                ml: 0.5,
                              }}
                            >
                              ({absDiff}d ahead of plan)
                            </Box>
                          )}
                          {status === "behind" && (
                            <Box
                              component="span"
                              sx={{
                                fontSize: "0.7rem",
                                opacity: 0.5,
                                color: "text.primary",
                                fontWeight: 500,
                                ml: 0.5,
                              }}
                            >
                              ({absDiff}d behind schedule)
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    {task.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontStyle: "italic",
                          color: "text.secondary",
                          pl: 1,
                          borderLeft: "2px solid #eee",
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </List>
        )}
      </Container>

      <SortDrawer
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        sortConfig={historySort}
        setSortConfig={setHistorySort}
        title="Sort Records By"
        options={[
          {
            label: "Completion Date",
            key: "actualDate",
            icon: <HistoryIcon />,
          },
          {
            label: "Actual Taken (Days)",
            key: "actualDays",
            icon: <AccessTimeIcon />,
          },
        ]}
      />
    </Box>
  );
};

// ==========================================
// Main App Component
// ==========================================

const App = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [view, setView] = useState("home");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    planId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "asc",
  });

  const [historySort, setHistorySort] = useState({
    key: "actualDate",
    direction: "asc",
  });

  const sortedPlans = React.useMemo(() => {
    let sortablePlans = [...plans];

    sortablePlans.sort((a, b) => {
      let valA, valB;

      switch (sortConfig.key) {
        case "progress": {
          const getProg = (p) => {
            const valid = p.actions.filter(
              (act) => act.status !== STATUS.CANCELED,
            );
            return valid.length > 0
              ? p.actions.filter((act) => act.status === STATUS.FINISHED)
                  .length / valid.length
              : 0;
          };
          valA = getProg(a);
          valB = getProg(b);
          break;
        }

        case "daysLeft": {
          valA = new Date(a.endDate).getTime();
          valB = new Date(b.endDate).getTime();
          break;
        }

        case "actions": {
          valA = a.actions.length;
          valB = b.actions.length;
          break;
        }

        default:
          valA = a[sortConfig.key] || "";
          valB = b[sortConfig.key] || "";
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortablePlans;
  }, [plans, sortConfig]);

  const [mode, setMode] = useState(
    localStorage.getItem("themeMode") || "light",
  );

  useEffect(() => {
    localStorage.setItem("themeMode", mode);

    const themeColor = mode === "dark" ? "#0f172a" : "#f8fafc";
    const barStyle = mode === "dark" ? "black-translucent" : "default";

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", themeColor);
    let metaApple = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );
    if (!metaApple) {
      metaApple = document.createElement("meta");
      metaApple.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute("content", barStyle);
  }, [mode]);

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  // Track the installation event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setDataLoading(true);
        setUser(u);
      } else {
        setUser(null);
        setPlans([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firestore Listener (FIXED)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "plans"),
      orderBy("startDate", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDataLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setPlans([]);
    setView("home");
  };

  const updateStatus = async (planId, actionIndex, currentStatus) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    let nextStatus = STATUS.PENDING;
    const now = new Date();
    const actualDate = now.toISOString().split("T")[0];
    const actualTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (currentStatus === STATUS.PENDING) nextStatus = STATUS.FINISHED;
    else if (currentStatus === STATUS.FINISHED) nextStatus = STATUS.CANCELED;
    else if (currentStatus === STATUS.CANCELED) nextStatus = STATUS.NOT_YET;

    const newActions = [...plan.actions];
    newActions[actionIndex].status = nextStatus;

    if (nextStatus === STATUS.FINISHED) {
      newActions[actionIndex].actualDate = actualDate;
      newActions[actionIndex].actualTime = actualTime;
    } else if (nextStatus === STATUS.NOT_YET) {
      newActions[actionIndex].actualDate = "";
      newActions[actionIndex].actualTime = "";
    }

    await updateDoc(doc(db, "users", user.uid, "plans", planId), {
      actions: newActions,
    });
  };

  const showMessage = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleRequestDelete = (id) => {
    setDeleteConfirmation({ open: true, planId: id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirmation.planId;
    if (!id) return;

    setIsDeleting(true);

    try {
      setView("home");
      setSelectedPlanId(null);

      await deleteDoc(doc(db, "users", user.uid, "plans", id));

      showMessage("Plan deleted successfully", "success");
    } catch (error) {
      console.error("Delete error", error);
      showMessage("Failed to delete plan", "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, planId: null });
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };

  if (loading || (user && dataLoading))
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  if (!user) return <LoginView />;

  return (
    <>
      {showInstallButton && (
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            width: { sm: 400 },
            top: 16,
            left: { xs: 16, sm: "auto" },
            right: 16,
            zIndex: 2000,
            p: 2,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{ bgcolor: "rgba(255,255,255,0.2)", p: 1, borderRadius: 2 }}
            >
              <BarChartIcon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">
                Install Stratum
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Access your plans directly from your home screen.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setShowInstallButton(false)}
              sx={{ color: "white", minWidth: "auto" }}
            >
              Later
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstallClick}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Install
            </Button>
          </Stack>
        </Paper>
      )}

      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isDeleting && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(255, 255, 255, 0.7)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <CircularProgress size={50} thickness={4} />
            <Typography
              sx={{ mt: 2, fontWeight: 600, color: "text.secondary" }}
            >
              Removing plan...
            </Typography>
          </Box>
        )}

        {view === "home" && (
          <HomeView
            user={user}
            plans={sortedPlans}
            setView={setView}
            setSelectedPlanId={setSelectedPlanId}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
          />
        )}
        {view === "detail" && (
          <DetailView
            plan={plans.find((p) => p.id === selectedPlanId)}
            setView={setView}
            onRequestDelete={handleRequestDelete}
            updateStatus={updateStatus}
          />
        )}
        {(view === "create" || view === "edit") && (
          <FormView
            user={user}
            plans={plans}
            selectedPlanId={selectedPlanId}
            setSelectedPlanId={setSelectedPlanId}
            setView={setView}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            showMessage={showMessage}
          />
        )}
        {view === "profile" && (
          <ProfileView
            user={user}
            handleLogout={handleLogout}
            mode={mode}
            setMode={setMode}
          />
        )}
        {view === "history" && (
          <HistoryView plans={plans} setView={setView} user={user} />
        )}
        <DeleteConfirmDialog
          open={deleteConfirmation.open}
          onClose={() => setDeleteConfirmation({ open: false, planId: null })}
          onConfirm={handleConfirmDelete}
        />
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            pb: { xs: "calc(14px + env(safe-area-inset-bottom))", sm: 0 },
            bgcolor: "background.paper",
            backgroundImage: "none",
            borderTop: 1,
            borderColor: "divider",
            zIndex: 1000,
          }}
          elevation={3}
        >
          <BottomNavigation
            value={view}
            onChange={(event, newValue) => setView(newValue)}
            showLabels
            sx={{ bgcolor: "transparent" }}
          >
            <BottomNavigationAction
              label="Home"
              value="home"
              icon={<HomeIcon />}
            />
            <BottomNavigationAction
              label="Completed"
              value="history"
              icon={<HistoryIcon />}
            />
            <BottomNavigationAction
              label="Profile"
              value="profile"
              icon={<PersonIcon />}
            />
          </BottomNavigation>
        </Paper>
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ bottom: { xs: 90, sm: 24 } }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </>
  );
};

export default App;
