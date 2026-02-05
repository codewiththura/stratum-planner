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
  Badge,
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
  Warning as WarningIcon,
  Assessment as BarChartIcon,
  Done as DoneIcon,
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

// --- Theme (Mobile First & Professional) ---
const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" }, // Royal Blue
    secondary: { main: "#64748b" }, // Slate
    success: { main: "#10b981" }, // Emerald
    warning: { main: "#f59e0b" }, // Amber
    error: { main: "#ef4444" }, // Red
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

const STATUS = { NOT_YET: "not_yet", PENDING: "pending", FINISHED: "finished" };

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
  return { label: `${diffDays} days left`, color: "success" }; // "success" typically renders green, used here for "safe"
};

// --- Main App Component ---
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Auth Loading
  const [isSaving, setIsSaving] = useState(false); // Saving State

  const [dataLoading, setDataLoading] = useState(false);

  // Navigation & Data
  const [view, setView] = useState("home");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [navValue, setNavValue] = useState(0);

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        // If user exists, we immediately mark data as loading
        // before the UI has a chance to render the empty list.
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

  // --- Firestore Data Sync ---
  useEffect(() => {
    if (!user) return;

    // (Optional backup: ensure loading is true when effect runs)
    setDataLoading(true);

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

  // --- Actions ---
  const handleLogout = () => {
    signOut(auth);
    setPlans([]);
    setView("home");
  };

  const deletePlan = async (id) => {
    if (confirm("Delete this plan?")) {
      await deleteDoc(doc(db, "users", user.uid, "plans", id));
      setView("home");
    }
  };

  const updateStatus = async (planId, actionIndex, currentStatus) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    let nextStatus = STATUS.PENDING;
    if (currentStatus === STATUS.PENDING) nextStatus = STATUS.FINISHED;
    else if (currentStatus === STATUS.FINISHED) nextStatus = STATUS.NOT_YET;

    const newActions = [...plan.actions];
    newActions[actionIndex].status = nextStatus;

    await updateDoc(doc(db, "users", user.uid, "plans", planId), {
      actions: newActions,
    });
  };

  // --- Views ---

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
        <CheckCircleIcon sx={{ fontSize: 40, color: "white" }} />
      </Box>
      <Typography variant="h5" fontWeight="800" gutterBottom>
        Weekly Action
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mb: 6, maxWidth: 300 }}
      >
        Professional weekly planning for mobile.
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

  const HomeView = () => (
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
            Weekly Planner
          </Typography>
          <Avatar src={user?.photoURL} sx={{ width: 32, height: 32 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 3 }}>
        {plans.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 8,
              opacity: 0.5,
            }}
          >
            <EventIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography>No active plans</Typography>
            <Typography variant="caption">Tap + to create one</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {plans.map((plan) => {
              // Logic
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
              const total = plan.actions.length;
              const progress = total > 0 ? (doneCount / total) * 100 : 0;
              const previewActions = plan.actions.slice(0, 3);
              const remainingActions = total - 3;

              return (
                <Card key={plan.id} elevation={0}>
                  <CardActionArea
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setView("detail");
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* 1. Header: Title & Days Left */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Box sx={{ pr: 1, flex: 1 }}>
                          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
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

                      {/* 2. NEW: Progress Bar Section (Between Title & List) */}
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
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "#f1f5f9",
                          }}
                          color={progress === 100 ? "success" : "primary"}
                        />
                      </Box>

                      {/* 3. Action Task List (Max 3) */}
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

                      {/* 4. Counters Footer */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        px={1}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckCircleIcon
                            color="success"
                            sx={{ fontSize: 18 }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="text.secondary"
                          >
                            {doneCount} Done
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AccessTimeIcon
                            color="warning"
                            sx={{ fontSize: 18 }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="text.secondary"
                          >
                            {activeCount} Active
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CircleIcon color="disabled" sx={{ fontSize: 18 }} />
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            color="text.secondary"
                          >
                            {todoCount} To Do
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
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
    </Box>
  );

  const DetailView = () => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return null;
    const doneCount = plan.actions.filter(
      (a) => a.status === STATUS.FINISHED,
    ).length;
    const progress = (doneCount / plan.actions.length) * 100;

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
            <IconButton color="error" onClick={() => deletePlan(plan.id)}>
              <DeleteIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {plan.title}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Chip
                icon={<EventIcon />}
                label={`Due ${new Date(plan.endDate).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" fontWeight="bold" color="primary">
                {Math.round(progress)}% Complete
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
          >
            Execution List
          </Typography>

          <List disablePadding>
            {plan.actions.map((action, idx) => {
              const isDone = action.status === STATUS.FINISHED;
              return (
                <ListItem
                  key={idx}
                  disableGutters
                  sx={{ borderBottom: "1px solid #f8fafc", py: 1.5 }}
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
                    ) : (
                      <CircleIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={action.title || action.name}
                    secondary={
                      action.dateType === "specific" && action.specificDate
                        ? `${new Date(action.specificDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${action.duration ? `• ${action.duration}` : ""}`
                        : action.description
                    }
                    primaryTypographyProps={{
                      sx: {
                        textDecoration: isDone ? "line-through" : "none",
                        color: isDone ? "text.secondary" : "text.primary",
                        fontWeight: isDone ? 400 : 500,
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

  const FormView = () => {
    const existing = plans.find((p) => p.id === selectedPlanId);

    // We do NOT use local state here anymore. We use the parent's `isSaving`.

    const [formData, setFormData] = useState(
      existing || {
        title: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        actions: [{ id: Date.now(), title: "", status: STATUS.NOT_YET }],
      },
    );

    const handleSave = async () => {
      if (!formData.title || !formData.endDate)
        return alert("Title and Deadline required");

      // Trigger the Parent's loading state
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
        } else {
          const docRef = await addDoc(
            collection(db, "users", user.uid, "plans"),
            { ...payload, createdAt: new Date().toISOString() },
          );
          // Set the ID immediately so we can transition to it
          setSelectedPlanId(docRef.id);
        }

        // Navigation Logic:
        // 1. Switch view FIRST
        setView("detail");
        // 2. Turn off loading LAST (after the new view has mounted)
        setTimeout(() => setIsSaving(false), 100);
      } catch (error) {
        console.error("Error saving plan:", error);
        alert("Failed to save. Please try again.");
        setIsSaving(false);
      }
    };

    const addActionField = () => {
      setFormData((prev) => ({
        ...prev,
        actions: [
          ...prev.actions,
          { id: Date.now(), title: "", status: STATUS.NOT_YET },
        ],
      }));
    };

    return (
      <Dialog
        fullScreen
        open={true}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        <AppBar
          position="relative"
          color="default"
          elevation={0}
          sx={{ borderBottom: "1px solid #eee" }}
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
            {/* <IconButton
              color="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <DoneIcon />
            </IconButton> */}
          </Toolbar>
        </AppBar>

        {isSaving ? (
          // Full screen loader that persists during the update
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
            <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
              <Stack spacing={3}>
                <TextField
                  label="Goal / Title"
                  fullWidth
                  variant="standard"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  InputProps={{
                    style: { fontSize: "1.25rem", fontWeight: 600 },
                  }}
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

                {formData.actions.map((action, idx) => (
                  <Box
                    key={idx}
                    sx={{ display: "flex", gap: 1, alignItems: "center" }}
                  >
                    <CircleIcon fontSize="small" color="disabled" />
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="Task name..."
                      value={action.title}
                      onChange={(e) => {
                        const newActions = [...formData.actions];
                        newActions[idx].title = e.target.value;
                        setFormData({ ...formData, actions: newActions });
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const newActions = formData.actions.filter(
                          (_, i) => i !== idx,
                        );
                        setFormData({ ...formData, actions: newActions });
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

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
                disabled={isSaving}
              >
                Save Plan
              </Button>
            </Paper>
          </>
        )}
      </Dialog>
    );
  };

  const ProfileView = () => (
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
        <ListItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemText primary="Sign Out" />
        </ListItem>
      </List>
    </Box>
  );

  if (loading || (user && dataLoading)) {
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
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!user && !loading ? (
        <LoginView />
      ) : (
        <>
          {view === "home" && <HomeView />}
          {view === "detail" && <DetailView />}
          {(view === "create" || view === "edit") && <FormView />}
          {view === "profile" && <ProfileView />}

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
                <BottomNavigationAction
                  label="Dashboard"
                  icon={<HomeFilled />}
                />
                <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
              </BottomNavigation>
            </Paper>
          )}
        </>
      )}
    </ThemeProvider>
  );
};

export default App;
