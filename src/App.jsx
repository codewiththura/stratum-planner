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
  HomeFilled,
  Person as PersonIcon,
  Close as CloseIcon,
  Assessment as BarChartIcon,
  Sort as SortIcon,
  Block as BlockIcon,
  Task as TaskIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
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
  if (diffDays === 1) return { label: "Tomorrow", color: "warning" };
  if (diffDays <= 3)
    return { label: `${diffDays} days left`, color: "warning" };
  return { label: `${diffDays} days left`, color: "success" };
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

const SortDrawer = ({ open, onClose, sortConfig, setSortConfig }) => {
  const options = [
    { label: "Start Date", key: "startDate", icon: <EventIcon /> },
    { label: "Progress Level", key: "progress", icon: <BarChartIcon /> },
    { label: "Urgency (Days Left)", key: "daysLeft", icon: <AccessTimeFilledIcon /> },
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
          Sort Plans By
        </Typography>

        <List sx={{ mb: 2 }}>
          {options.map((option) => (
            <ListItem key={option.key} disablePadding>
              <ListItemButton
                selected={sortConfig.key === option.key}
                onClick={() => {
                  setSortConfig({ ...sortConfig, key: option.key });
                }}
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
                  {option.icon}
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
    <Box sx={{ pb: 12 }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: "background.default",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
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
            Dashboard
          </Typography>
          <Avatar src={user?.photoURL} sx={{ width: 32, height: 32 }} />
        </Toolbar>
      </AppBar>

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
              color: isFiltered ? "primary.main" : "text.secondary",
              bgcolor: "transparent",
              borderRadius: "10px",
              fontWeight: 500,
              px: 1.8,
              py: 0.6,
              "&:hover": {
                opacity: 0.7,
              },
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              borderColor: "primary.main",
            }}
          >
            {isFiltered ? `Sorted By: ${sortLabels[sortConfig.key]}` : "Sort By"}
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
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: 16 }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                          sx={{ fontSize: 10 }}
                        >
                          {doneCount} Done
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon color="warning" sx={{ fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                          sx={{ fontSize: 10 }}
                        >
                          {activeCount} Active
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CircleIcon color="disabled" sx={{ fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                          sx={{ fontSize: 10 }}
                        >
                          {todoCount} To Do
                        </Typography>
                      </Stack>
                      {canceledCount > 0 && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <BlockIcon
                            sx={{ fontSize: 16, color: "text.disabled" }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="text.secondary"
                            sx={{ fontSize: 10 }}
                          >
                            {canceledCount} Canceled
                          </Typography>
                        </Stack>
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.paper" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid #f1f5f9" }}
      >
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
            spacing={1}
            mb={2}
          >
            <Chip
              icon={<EventIcon sx={{ fontSize: "1rem !important" }} />}
              label={`${new Date(plan.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${new Date(plan.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
              size="small"
              variant="outlined"
              sx={{ color: "text.secondary" }}
            />
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
              bgcolor: "#f8fafc",
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
                value={totalActions}
                color="text.primary"
              />
              <StatItem label="Done" value={doneCount} color="success.main" />
              <StatItem
                label="Active"
                value={pendingCount}
                color="warning.main"
              />
              <StatItem
                label="Skipped"
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

        <List disablePadding>
          {plan.actions.map((action, idx) => {
            const isDone = action.status === STATUS.FINISHED;
            return (
              <ListItem
                key={idx}
                disableGutters
                sx={{ borderBottom: "1px solid #f8fafc", py: 1 }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => updateStatus(plan.id, idx, action.status)}
                  >
                    {action.status === STATUS.PENDING ? (
                      <AccessTimeIcon color="warning" />
                    ) : null}
                  </IconButton>
                }
              >
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
                  primary={action.title || action.name}
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      {action.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ lineHeight: 1.3 }}
                        >
                          {action.description}
                        </Typography>
                      )}

                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <EventIcon
                          sx={{ fontSize: 12, color: "primary.main" }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight="600"
                          color="primary.main"
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
                                  }}
                                >
                                  •{" "}
                                  {action.endTime
                                    ? calculateDuration(
                                        action.startTime,
                                        action.endTime,
                                      )
                                    : action.startTime}
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
                            sx={{ mt: 0.2 }}
                          >
                            <Typography
                              variant="caption"
                              color="textDisabled"
                              fontWeight="500"
                            >
                              Completed:{" "}
                              {new Date(action.actualDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                              {action.actualTime && ` @ ${action.actualTime}`}
                            </Typography>
                          </Stack>
                        )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    sx: {
                      textDecoration:
                        isDone || action.status === STATUS.CANCELED
                          ? "line-through"
                          : "none",
                      color:
                        isDone || action.status === STATUS.CANCELED
                          ? "text.secondary"
                          : "text.primary",
                      opacity: action.status === STATUS.CANCELED ? 0.6 : 1,
                      fontWeight:
                        isDone || action.status === STATUS.CANCELED ? 400 : 500,
                    },
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </Container>
    </Box>
  );
};

const clampDate = (dateStr, minDate, maxDate) => {
  if (!dateStr || !minDate || !maxDate) return dateStr;
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
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

  return (
    <Dialog
      fullScreen
      open={true}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: "background.paper",
          borderBottom: "1px solid #eee",
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
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="primary">
                ACTION TASKS
              </Typography>
              {formData.actions.map((action, idx) => {
                const scheduleMode =
                  action.startTime || action.endTime ? "time" : "range";

                return (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{ p: 2.5, mb: 2, borderRadius: 3 }}
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

                    <ToggleButtonGroup
                      value={scheduleMode}
                      exclusive
                      size="small"
                      onChange={(_, mode) => {
                        if (!mode) return;

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
                      sx={{ mb: 2, display: "flex" }}
                    >
                      <ToggleButton value="range" sx={{ flex: 1 }}>
                        Date Range
                      </ToggleButton>
                      <ToggleButton value="time" sx={{ flex: 1 }}>
                        Time Slot
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <Stack spacing={2}>
                      <TextField
                        type="date"
                        label="Date"
                        fullWidth
                        size="small"
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
                        value={action.description || ""}
                        onChange={(e) =>
                          updateActionField(idx, "description", e.target.value)
                        }
                      />
                    </Stack>

                    {action.status === STATUS.FINISHED && (
                      <Box
                        sx={{ mt: 2, pt: 2, borderTop: "1px solid #f1f5f9" }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="success.main"
                          sx={{ mb: 2, display: "block" }}
                        >
                          COMPLETION (LOGGED)
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            type="date"
                            label="Actual Date"
                            fullWidth
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
              display: "flex",
              justifyContent: "center",
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

const ProfileView = ({ user, handleLogout }) => (
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
    <Typography variant="h6">{user.displayName}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
      {user.email}
    </Typography>
    <List
      sx={{
        width: "100%",
        maxWidth: 360,
        bgcolor: "background.paper",
        borderRadius: 2,
      }}
    >
      <ListItem button onClick={handleLogout} sx={{ color: "error.main" }}>
        <ListItemText primary="Sign Out" />
      </ListItem>
    </List>
  </Box>
);

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
          <ProfileView user={user} handleLogout={handleLogout} />
        )}
        {(view === "home" || view === "profile") && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
            elevation={3}
          >
            <BottomNavigation
              showLabels
              value={view === "profile" ? 1 : 0}
              onChange={(event, newValue) =>
                setView(newValue === 0 ? "home" : "profile")
              }
            >
              <BottomNavigationAction label="Dashboard" icon={<HomeFilled />} />
              <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
            </BottomNavigation>
          </Paper>
        )}

        <DeleteConfirmDialog
          open={deleteConfirmation.open}
          onClose={() => setDeleteConfirmation({ open: false, planId: null })}
          onConfirm={handleConfirmDelete}
        />

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
