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
  Menu,
  MenuItem,
  GlobalStyles,
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
  RadioButtonCheckedOutlined as RadioButtonCheckedOutlinedIcon,
  RadioButtonUnchecked as CircleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Assessment as BarChartIcon,
  Block as BlockIcon,
  Task as TaskIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  Home as HomeIcon,
  ScheduleOutlined as ScheduleOutlinedIcon,
  History as HistoryIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MoreVert as MoreVertIcon,
  Dehaze as DehazeIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
} from "@mui/icons-material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

import { useSwipeable } from "react-swipeable";

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

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: mode === "light" ? "#2563eb" : "#4468d7",
      contrastText: "#ffffff",
    },
    background: {
      default: mode === "light" ? "#f8fafc" : "#282828",
      paper: mode === "light" ? "#ffffff" : "#242424",
    },
    success: {
      main: mode === "light" ? "#1b7f5c" : "#22946e",
    },
    warning: {
      main: mode === "light" ? "#b8871f" : "#a87a2a",
    },
    error: {
      main: mode === "light" ? "#b13535" : "#9c2121",
    },
    info: {
      main: mode === "light" ? "#1e56a3" : "#21498a",
    },
    text: {
      primary: mode === "light" ? "#000000" : "#ffffff",
      secondary: mode === "light" ? "#5d5d64" : "#8f9095",
    },
    divider: mode === "light" ? "#e2e8f0" : "#3c4043",
  },
  typography: {
    fontFamily: '"Google Sans", "Inter", "Roboto", sans-serif',
    h6: { fontWeight: 500, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          border: `0.8px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          "&:hover": {
            backgroundColor:
              theme.palette.mode === "light" ? "#f7f7f7" : "#2a2a2a",
          },
        }),
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          "&:hover .MuiCardActionArea-focusHighlight": {
            opacity: 0,
          },
        },
        focusHighlight: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: "0.8125rem",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: "0.8125rem",
        }),
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

  if (diffDays < 0) return { label: "Overdue", color: "error" };
  if (diffDays === 0) return { label: "Today", color: "warning" };
  if (diffDays === 1) return { label: "Tomorrow", color: "warning" };

  return { label: `${diffDays} days left`, color: "default" };
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

const DeleteConfirmDialog = ({
  title,
  description,
  open,
  onClose,
  onConfirm,
  confirmLabel,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    PaperProps={{
      sx: {
        bgcolor: "background.paper",
        backgroundImage: "none",
        borderRadius: 3,
      },
    }}
  >
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {description}
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} color="inherit" sx={{ borderRadius: 3 }}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="contained"
        autoFocus
        sx={{ borderRadius: 3 }}
      >
        {confirmLabel}
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

const SharedHeader = ({ title, user, onMenuClick }) => (
  <AppBar
    position="sticky"
    color="inherit"
    elevation={0}
    sx={{
      zIndex: (theme) => theme.zIndex.drawer + 1,
    }}
  >
    <Toolbar sx={{ py: 0.5 }}>
      <IconButton onClick={onMenuClick} sx={{ mr: 1, color: "text.primary" }}>
        <DehazeIcon />
      </IconButton>
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: "primary.main",
          borderRadius: 3,
          display: { xs: "none", sm: "flex" },
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
        sx={{
          flexGrow: 1,
          color: "text.primary",
          letterSpacing: -0.5,
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
        }}
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
    <Typography variant="h5" fontWeight="800" align="center" gutterBottom>
      Stratum - The Action Planner
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      sx={{ mb: 6, mt: 2, maxWidth: 300 }}
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
  const [localConfig, setLocalConfig] = React.useState(sortConfig);

  React.useEffect(() => {
    if (open) setLocalConfig(sortConfig);
  }, [open, sortConfig]);

  const handleApply = () => {
    setSortConfig(localConfig);
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          p: 3,
          pb: 5,
          bgcolor: "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
        <Typography sx={{ mb: 2, textAlign: "center" }}>
          {title || "Sort By"}
        </Typography>

        <List sx={{ mb: 2 }}>
          {options.map((option) => (
            <ListItem key={option.key} disablePadding>
              <ListItemButton
                selected={localConfig.key === option.key}
                onClick={() =>
                  setLocalConfig({ ...localConfig, key: option.key })
                }
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                {/* <ListItemIcon
                  sx={{
                    color:
                      sortConfig.key === option.key
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  {option.icon || <SortIcon />}
                </ListItemIcon> */}
                <ListItemText primary={option.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mb: 2 }} />
        <ToggleButtonGroup
          value={localConfig.direction}
          exclusive
          fullWidth
          onChange={(_, dir) =>
            dir && setLocalConfig({ ...localConfig, direction: dir })
          }
          size="small"
        >
          <ToggleButton value="asc">Ascending</ToggleButton>
          <ToggleButton value="desc">Descending</ToggleButton>
        </ToggleButtonGroup>
        <Button
          fullWidth
          variant="contained"
          onClick={handleApply}
          sx={{ mt: 3, py: 1.5, borderRadius: 3 }}
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
  onMenuClick,
}) => {
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  return (
    <Box
      sx={{
        pb: "calc(80px + env(safe-area-inset-bottom))",
        minHeight: "100vh",
      }}
    >
      <SharedHeader title="Dashboard" user={user} onMenuClick={onMenuClick} />
      <Container maxWidth="sm">
        <Box
          sx={{
            position: "sticky",
            top: { xs: 55, sm: 64 },
            zIndex: 10,
            bgcolor: "background.default",
            pt: 1,
            pb: 2,
            px: 1,
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            {plans.length} {plans.length === 1 ? "Active Plan" : "Active Plans"}
          </Typography>

          <Button
            onClick={() => setIsSortOpen(true)}
            size="small"
            endIcon={
              sortConfig.direction == "asc" ? (
                <ArrowUpwardIcon />
              ) : (
                <ArrowDownwardIcon />
              )
            }
            variant="outlined"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "text.secondary",
              borderColor: "divider",
              px: 2,
              bgcolor: "background.paper",
              borderRadius: 2.5,
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light" ? "#f7f7f7" : "#2a2a2a",
              },
            }}
          >
            {(() => {
              const labels = {
                startDate: "Start date",
                progress: "Progress",
                daysLeft: "Urgency",
                actions: "Task count",
              };
              return `Sort by: ${labels[sortConfig.key]}`;
            })()}
          </Button>
        </Box>
        <Divider sx={{ display: "none" }} />

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
                        color={daysMeta.color}
                        variant="filled"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          flexShrink: 0,
                          fontSize: 12,
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
                          variant="h6"
                          fontWeight="bold"
                          color={
                            progress === 100 ? "success.main" : "primary.main"
                          }
                          sx={{ ml: "auto !important" }}
                        >
                          {Math.round(progress)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 6, borderRadius: 3 }}
                        color={progress === 100 ? "success" : "primary"}
                      />
                    </Box>

                    <Stack spacing={1} mb={2.5}>
                      {previewActions.map((action, idx) => {
                        let StatusIcon = CircleIcon;
                        let iconColor = "text.disabled";
                        if (action.status === STATUS.FINISHED) {
                          StatusIcon = RadioButtonCheckedOutlinedIcon;
                          iconColor = "text.secondary";
                        } else if (action.status === STATUS.PENDING) {
                          StatusIcon = AccessTimeIcon;
                        } else if (action.status === STATUS.CANCELED) {
                          StatusIcon = BlockIcon;
                        }
                        return (
                          <Stack
                            key={idx}
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                          >
                            <StatusIcon
                              sx={{
                                fontSize: 16,
                                color: iconColor,
                              }}
                            />
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
                          color="text.secondary"
                          sx={{ pl: 3.5, fontWeight: 400 }}
                        >
                          + {remainingActions} more items
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
        sx={{ position: "fixed", bottom: 70, right: 40 }}
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
        options={[
          { label: "Start date", key: "startDate", icon: <EventIcon /> },
          { label: "Progress", key: "progress", icon: <BarChartIcon /> },
          {
            label: "Urgency",
            key: "daysLeft",
            icon: <AccessTimeFilledIcon />,
          },
          { label: "Task count", key: "actions", icon: <TaskIcon /> },
        ]}
      />
    </Box>
  );
};

const StatItem = ({ label, value }) => (
  <Box
    sx={{
      textAlign: "center",
      flex: 1,
      minWidth: 0,
      px: 0.25,
    }}
  >
    <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      display="block"
      noWrap
      sx={{
        fontWeight: 500,
        fontSize: { xs: "0.65rem", sm: "0.75rem" },
        mt: 0.5,
      }}
    >
      {label}
    </Typography>
  </Box>
);

const DetailView = ({ plan, setView, onRequestDelete, updateStatus }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handlers = useSwipeable({
    onSwipedRight: () => setView("home"),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    delta: 80,
  });

  if (!plan) return null;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setView("edit");
  };

  const handleDelete = () => {
    handleMenuClose();
    onRequestDelete(plan.id);
  };

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

  const remainingCount =
    totalActions - (doneCount + pendingCount + todoCount + canceledCount);

  const validActionsCount = totalActions - canceledCount;
  const progress =
    validActionsCount > 0 ? (doneCount / validActionsCount) * 100 : 0;
  const daysMeta = getDaysLeft(plan.endDate);

  return (
    <Box
      {...handlers}
      sx={{
        pb: "calc(80px + env(safe-area-inset-bottom))",
        minHeight: "100vh",
        transition: "transform 0.2s ease-out",
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: "background.paper" }}
      >
        <Toolbar sx={{ py: 0.5 }}>
          <IconButton
            edge="start"
            onClick={() => setView("home")}
            sx={{ ml: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                borderRadius: 2,
                minWidth: 150,
                mt: 1,
                backgroundImage: "none",
                bgcolor: "background.paper",
              },
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Plan</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete Plan</ListItemText>
            </MenuItem>
          </Menu>
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
              {`${new Date(plan.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${new Date(plan.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
            </Typography>
            <Chip
              label={daysMeta.label}
              size="small"
              variant="filled"
              color={daysMeta.color}
              sx={{
                fontWeight: 500,
                flexShrink: 0,
                fontSize: 12,
              }}
            />
            <Typography
              variant="h6"
              fontWeight="bold"
              color={progress === 100 ? "success.main" : "primary.main"}
              sx={{ ml: "auto !important" }}
            >
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={progress === 100 ? "success" : "primary"}
            sx={{ height: 8, borderRadius: 4, my: 3 }}
          />
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              py: 1.5,
              px: 1,
              borderRadius: 3,
              borderStyle: "dashed",
            }}
          >
            <Stack
              direction="row"
              spacing={{ xs: 0, sm: 1 }}
              justifyContent="space-between"
              alignItems="center"
            >
              <StatItem label="Total" value={totalActions} />
              <StatItem label="Done" value={doneCount} />
              <StatItem label="Active" value={pendingCount} />
              <StatItem label="Cancelled" value={canceledCount} />
              <StatItem label="To Do" value={remainingCount} />
            </Stack>
          </Paper>
        </Box>

        <List sx={{ width: "100%", p: 0 }}>
          {plan.actions.map((action, idx) => {
            const isDone = action.status === STATUS.FINISHED;
            return (
              <>
                <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                  <ListItemIcon
                    sx={{ minWidth: 40 }}
                    onClick={() => updateStatus(plan.id, idx, action.status)}
                  >
                    {isDone ? (
                      <RadioButtonCheckedOutlinedIcon color="disabled" />
                    ) : action.status === STATUS.PENDING ? (
                      <AccessTimeIcon />
                    ) : action.status === STATUS.CANCELED ? (
                      <BlockIcon color="disabled" />
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
                            color="textDisabled"
                            sx={{
                              fontStyle: "italic",
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

                        {action.startDate && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ mt: 1 }}
                          >
                            <EventIcon
                              sx={{ fontSize: 12, color: "text.disabled" }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="500"
                              color="textDisabled"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {new Date(action.startDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                              {action.endDate &&
                                ` - ${new Date(
                                  action.endDate,
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}`}

                              {action.startTime && (
                                <Box
                                  component="span"
                                  sx={{
                                    ml: 0.5,
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {" • "}
                                  {action.endTime ? (
                                    <>
                                      <ScheduleOutlinedIcon
                                        sx={{
                                          fontSize: 12,
                                          mx: 0.5,
                                          color: "text.disabled",
                                        }}
                                      />
                                      {calculateDuration(
                                        action.startTime,
                                        action.endTime,
                                      )}
                                    </>
                                  ) : (
                                    formatTo12Hour(action.startTime)
                                  )}
                                </Box>
                              )}
                            </Typography>
                          </Stack>
                        )}

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
                <Divider variant="middle" component="li" />
              </>
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
  const [errors, setErrors] = useState({});

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

  const handlers = useSwipeable({
    onSwipedRight: () => {
      if (!isSaving) {
        setIsSaving(false);
        setView(existing ? "detail" : "home");
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    delta: 80,
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

        if (value === null) {
          finalValue = "";
        } else if (
          ["startDate", "endDate", "specificDate"].includes(fieldOrUpdates)
        ) {
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
    const newErrors = {};
    let isValid = true;
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = "Please enter a goal title";
      isValid = false;
    }

    if (!formData.endDate) {
      newErrors.endDate = "Please select a deadline";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

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

  const getButtonLabel = () => {
    if (isSaving) return existing ? "Updating..." : "Saving...";
    return existing ? "Update" : "Save";
  };

  return (
    <Dialog
      fullScreen
      open={true}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{
        ...handlers,
        sx: { bgcolor: "background.default", backgroundImage: "none" },
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: "background.paper",
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            sx={{
              borderRadius: 50,
              px: 3,
            }}
          >
            {getButtonLabel()}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
        <Stack spacing={3}>
          <TextField
            label="Goal / Title"
            fullWidth
            required
            variant="standard"
            value={formData.title}
            error={!!errors.title}
            helperText={errors.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: null });
            }}
          />
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Start"
              value={formData.startDate ? dayjs(formData.startDate) : null}
              onChange={(newValue) =>
                setFormData({
                  ...formData,
                  startDate: newValue ? newValue.format("YYYY-MM-DD") : "",
                })
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Deadline"
              value={formData.endDate ? dayjs(formData.endDate) : null}
              onChange={(newValue) => {
                setFormData({
                  ...formData,
                  endDate: newValue ? newValue.format("YYYY-MM-DD") : "",
                });
                if (errors.endDate) setErrors({ ...errors, endDate: null });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.endDate,
                  helperText: errors.endDate,
                },
              }}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />
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
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Task name..."
                    value={action.title}
                    onChange={(e) => {
                      updateActionField(idx, "title", e.target.value);
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
                        sx={{ color: "text.secondary" }}
                      >
                        {scheduleMode === "time" ? "Time Slot" : "Date Range"}
                      </Typography>
                    }
                    labelPlacement="start"
                  />
                </Box>

                <Stack spacing={3}>
                  <DatePicker
                    label="Date"
                    value={action.startDate ? dayjs(action.startDate) : null}
                    onChange={(newValue) =>
                      updateActionField(
                        idx,
                        "startDate",
                        newValue ? newValue.format("YYYY-MM-DD") : null,
                      )
                    }
                    minDate={
                      formData.startDate ? dayjs(formData.startDate) : null
                    }
                    maxDate={formData.endDate ? dayjs(formData.endDate) : null}
                    slotProps={{
                      textField: { size: "small", fullWidth: true },
                      actionBar: {
                        actions: ["clear", "cancel", "accept"],
                      },
                    }}
                  />

                  {scheduleMode === "range" ? (
                    <DatePicker
                      label="End Date"
                      value={action.endDate ? dayjs(action.endDate) : null}
                      onChange={(newValue) =>
                        updateActionField(
                          idx,
                          "endDate",
                          newValue ? newValue.format("YYYY-MM-DD") : null,
                        )
                      }
                      minDate={
                        action.startDate
                          ? dayjs(action.startDate)
                          : formData.startDate
                            ? dayjs(formData.startDate)
                            : null
                      }
                      maxDate={
                        formData.endDate ? dayjs(formData.endDate) : null
                      }
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                        actionBar: {
                          actions: ["clear", "cancel", "accept"],
                        },
                      }}
                    />
                  ) : (
                    <Stack direction="row" spacing={2}>
                      <TimePicker
                        label="From"
                        value={
                          action.startTime
                            ? dayjs(`2000-01-01T${action.startTime}`)
                            : null
                        }
                        onChange={(newValue) =>
                          updateActionField(
                            idx,
                            "startTime",
                            newValue ? newValue.format("HH:mm") : null,
                          )
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                          actionBar: {
                            actions: ["clear", "cancel", "accept"],
                          },
                        }}
                      />
                      <TimePicker
                        label="To"
                        value={
                          action.endTime
                            ? dayjs(`2000-01-01T${action.endTime}`)
                            : null
                        }
                        onChange={(newValue) =>
                          updateActionField(
                            idx,
                            "endTime",
                            newValue ? newValue.format("HH:mm") : null,
                          )
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                          actionBar: {
                            actions: ["clear", "cancel", "accept"],
                          },
                        }}
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
                      sx={{ mb: 2, display: "block" }}
                    >
                      COMPLETION (LOGGED)
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <DatePicker
                        label="Actual Date"
                        value={
                          action.actualDate ? dayjs(action.actualDate) : null
                        }
                        onChange={(newValue) =>
                          updateActionField(
                            idx,
                            "actualDate",
                            newValue ? newValue.format("YYYY-MM-DD") : "",
                          )
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
                      />
                      <TimePicker
                        label="Actual Time"
                        value={
                          action.actualTime
                            ? dayjs(`2000-01-01T${action.actualTime}`)
                            : null
                        }
                        onChange={(newValue) =>
                          updateActionField(
                            idx,
                            "actualTime",
                            newValue ? newValue.format("HH:mm") : "",
                          )
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
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

      {isSaving && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "background",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
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
      )}

      <DeleteConfirmDialog
        title="Remove this task?"
        description="Are you sure you want to remove this task? This action cannot be undone."
        confirmLabel="Remove"
        open={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
      />
    </Dialog>
  );
};

const ProfileView = ({ user, handleLogout, mode, setMode, onMenuClick }) => (
  <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
    <SharedHeader title="Profile" user={user} onMenuClick={onMenuClick} />
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
        sx={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 4,
          overflow: "hidden",
        }}
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
  </Box>
);

const TaskDetailDialog = ({ open, onClose, task }) => {
  if (!task) return null;

  const start = new Date(task.startDate);
  const plannedEnd = task.endDate ? new Date(task.endDate) : start;
  const actualEnd = new Date(task.actualDate);

  // Calculate Durations
  const plannedDuration =
    Math.floor((plannedEnd - start) / (1000 * 60 * 60 * 24)) + 1;
  const actualDuration =
    Math.floor((actualEnd - start) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate Deviation
  const diffTime = plannedEnd.getTime() - actualEnd.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusLabel = "On Time";
  let statusColor = "success";
  let statusIcon = <RadioButtonCheckedOutlinedIcon fontSize="inherit" />;

  if (diffDays > 0) {
    statusLabel = `${diffDays} days ahead`;
    statusColor = "success";
    statusIcon = <ArrowUpwardIcon sx={{ fontSize: 12 }} />;
  } else if (diffDays < 0) {
    statusLabel = `${Math.abs(diffDays)} days behind`;
    statusColor = "error";
    statusIcon = <ArrowDownwardIcon sx={{ fontSize: 12 }} />;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight="700"
          sx={{ letterSpacing: 1, fontSize: "0.65rem" }}
        >
          {task.planTitle?.toUpperCase() || "NO PLAN"}
        </Typography>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            mt: 0.5,
            fontSize: "1.1rem",
            display: "-webkit-box",
            overflow: "hidden",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
          }}
        >
          {task.title || task.name}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Divider sx={{ borderStyle: "dashed" }} />

          {/* Grid for Details (2 Columns) */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Left Col: Dates */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.disabled">
                    Planned Date
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
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
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled">
                    Actual End
                  </Typography>
                  <Stack
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 1.5,
                      "@media (max-width: 400px)": {
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 1,
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight="500">
                      {actualEnd.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                    <Chip
                      icon={statusIcon}
                      label={statusLabel}
                      size="small"
                      color={statusColor}
                      variant="soft"
                      sx={{
                        bgcolor: `${statusColor}.light`,
                        color: `${statusColor}.contrastText`,
                        fontSize: 10,
                        height: 20,
                        "& .MuiChip-icon": {
                          fontSize: 12,
                          marginLeft: "4px",
                        },
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Right Col: Duration */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1}>
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    p: 0.5,
                    textAlign: "center",
                    bgcolor: "transparent",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" fontSize="1rem">
                    {`${plannedDuration}d`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontSize="0.65rem"
                  >
                    Planned
                  </Typography>
                </Paper>
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    p: 0.5,
                    textAlign: "center",
                    bgcolor: "transparent",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" fontSize="1rem">
                    {`${actualDuration}d`}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize="0.65rem"
                    color="text.disabled"
                  >
                    Taken
                  </Typography>
                </Paper>
              </Stack>
              {/* Timestamp Footer */}
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  color: "text.secondary",
                  flexWrap: "wrap",
                  gap: 0.5,
                  "@media (max-width: 400px)": {
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 0,
                  },
                }}
              >
                <Typography variant="caption" component="span">
                  Completed at
                </Typography>
                <Typography variant="caption" component="span">
                  {formatTo12Hour(task.actualTime)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, mt: 1 }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HistoryView = ({ user, plans, setView, onMenuClick }) => {
  const [historySort, setHistorySort] = useState({
    key: "actualDate",
    direction: "desc",
  });
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Track selected task for modal

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
      <SharedHeader
        title="Completed Actions"
        user={user}
        onMenuClick={onMenuClick}
      />
      <Container maxWidth="sm">
        <Box
          sx={{
            position: "sticky",
            top: { xs: 56, sm: 64 },
            zIndex: 10,
            bgcolor: "background.default",
            pt: 1,
            pb: 2,
            px: 1,
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
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
            endIcon={
              historySort.direction == "asc" ? (
                <ArrowUpwardIcon />
              ) : (
                <ArrowDownwardIcon />
              )
            }
            variant="outlined"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "text.secondary",
              borderColor: "divider",
              px: 2,
              borderRadius: 2.5,
              bgcolor: "background.paper",
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? "#f7f7f7"
                    : "rgba(10, 87, 209, 0.08)",
              },
            }}
          >
            {(() => {
              const labels = {
                actualDate: "Completed on",
                actualDays: "Time taken",
              };
              return `Sort by: ${labels[historySort.key]}`;
            })()}
          </Button>
        </Box>

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
              return (
                <React.Fragment key={index}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => setSelectedTask(task)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        mx: 1,
                        borderRadius: 2,
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: (theme) =>
                            theme.palette.mode === "light"
                              ? "rgba(0, 0, 0, 0.04)"
                              : "rgba(255, 255, 255, 0.05)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <RadioButtonCheckedOutlinedIcon
                          sx={{ color: "text.secondary" }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="500">
                            {task.title || task.name}
                          </Typography>
                        }
                        secondary={
                          <Box component="div" sx={{ mt: 0.5 }}>
                            {task.planTitle && (
                              <Typography
                                variant="caption"
                                color="textDisabled"
                                sx={{
                                  fontStyle: "italic",
                                  pl: 1,
                                  borderLeft: "2px solid",
                                  borderColor: "divider",
                                  mt: 0.8,
                                  display: "block",
                                }}
                              >
                                {task.planTitle}
                              </Typography>
                            )}
                            {task.status === STATUS.FINISHED &&
                              task.actualDate && (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.5}
                                  sx={{ mt: 0.5 }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="300"
                                  >
                                    Completed:{" "}
                                    {new Date(
                                      task.actualDate,
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    • {formatTo12Hour(task.actualTime)}
                                  </Typography>
                                </Stack>
                              )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: "div" }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider variant="middle" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Container>

      <TaskDetailDialog
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <SortDrawer
        open={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        sortConfig={historySort}
        setSortConfig={setHistorySort}
        options={[
          {
            label: "Completed on",
            key: "actualDate",
            icon: <HistoryIcon />,
          },
          {
            label: "Time taken",
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
  const [isNavOpen, setIsNavOpen] = useState(false);
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

  const [mode, setMode] = useState(
    localStorage.getItem("themeMode") || "light",
  );

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setIsNavOpen(open);
  };

  useEffect(() => {
    localStorage.setItem("themeMode", mode);

    const themeColor = mode === "dark" ? "#282828" : "#f8fafc";
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress size={48} thickness={4} />
          <Typography
            variant="caption"
            sx={{
              mt: 2,
              color: "text.secondary",
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            STRATUM
          </Typography>
        </Box>
      </ThemeProvider>
    );

  if (!user) return <LoginView />;

  return (
    <>
      {showInstallButton && (
        <Paper
          elevation={4}
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
            bgcolor: "background.paper",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                bgcolor: "primary.main",
                p: 1,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChartIcon sx={{ color: "primary.contrastText" }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="700">
                Install Stratum
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Access your plans directly from your home screen.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => setShowInstallButton(false)}
              sx={{ color: "text.secondary", minWidth: "auto" }}
            >
              Later
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstallClick}
              sx={{ boxShadow: 0 }}
            >
              Install
            </Button>
          </Stack>
        </Paper>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <GlobalStyles
            styles={{
              "@media (max-width: 600px)": {
                "*::-webkit-scrollbar": {
                  display: "none",
                },
                "*": {
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                },
              },
            }}
          />

          {isDeleting && (
            <Box
              sx={{
                position: "fixed",
                inset: 0,
                bgcolor: "background",
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

          <Drawer
            anchor="left"
            open={isNavOpen}
            onClose={toggleDrawer(false)}
            PaperProps={{
              sx: {
                width: 280,
                backgroundImage: "none",
                border: "none",
              },
            }}
          >
            <Toolbar />

            <List sx={{ px: 2, mt: 2 }}>
              {[
                { label: "Dashboard", value: "home", icon: <HomeIcon /> },
                { label: "Completed", value: "history", icon: <HistoryIcon /> },
                { label: "Profile", value: "profile", icon: <PersonIcon /> },
              ].map((item) => (
                <ListItem key={item.value} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={view === item.value}
                    onClick={() => {
                      setView(item.value);
                      setIsNavOpen(false);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemIcon
                      sx={{
                        color: view === item.value ? "primary.main" : "inherit",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        color:
                          view === item.value ? "primary.main" : "textPrimary",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Drawer>

          {view === "home" && (
            <HomeView
              user={user}
              plans={sortedPlans}
              setView={setView}
              setSelectedPlanId={setSelectedPlanId}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              onMenuClick={toggleDrawer(true)}
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
              onMenuClick={toggleDrawer(true)}
            />
          )}
          {view === "history" && (
            <HistoryView
              plans={plans}
              setView={setView}
              user={user}
              onMenuClick={() => setIsNavOpen(true)}
            />
          )}
          <DeleteConfirmDialog
            title="Delete this plan?"
            description="This action cannot be undone. The plan and all its tasks will be permanently removed."
            confirmLabel="Delete"
            open={deleteConfirmation.open}
            onClose={() => setDeleteConfirmation({ open: false, planId: null })}
            onConfirm={handleConfirmDelete}
          />
          <Snackbar
            open={notification.open}
            autoHideDuration={4000}
            onClose={handleCloseNotification}
            // anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            // sx={{ bottom: { xs: 90, sm: 24 } }}
          >
            <Alert
              onClose={handleCloseNotification}
              severity={notification.severity}
              // variant="filled"
              // sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </ThemeProvider>
      </LocalizationProvider>
    </>
  );
};

export default App;
