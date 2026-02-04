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
} from "firebase/firestore";
import {
  ChevronRight,
  Plus,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  BarChart3,
  Calendar,
  LayoutDashboard,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { getAnalytics } from "firebase/analytics";

// --- Firebase Configuration ---
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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const appId = "my-weekly-planner";

// --- Constants & Types ---
const STATUS = {
  NOT_YET: "not_yet",
  PENDING: "pending",
  FINISHED: "finished",
};

const STATUS_LABELS = {
  [STATUS.NOT_YET]: "Not Yet Started",
  [STATUS.PENDING]: "Pending",
  [STATUS.FINISHED]: "Finished",
};

const STATUS_COLORS = {
  [STATUS.NOT_YET]: "bg-slate-100 text-slate-600 border-slate-200",
  [STATUS.PENDING]: "bg-amber-50 text-amber-700 border-amber-200",
  [STATUS.FINISHED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// --- Components ---

const ProgressBar = ({ percentage }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        Execution Progress
      </span>
      <span className="text-xs font-bold text-slate-900">
        {Math.round(percentage)}%
      </span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-indigo-600 h-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [updatingActions, setUpdatingActions] = useState({});

  // Navigation State
  const [view, setView] = useState("list"); // 'list', 'create', 'detail', 'edit'
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // await signInWithRedirect(auth, provider);
      const result = await signInWithPopup(auth, provider);
      console.log("Popup login user:", result.user);
    } catch (err) {
      console.error("Login Error", err);
      setError("Failed to sign in with Google.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPlans([]);
    } catch (err) {
      console.error("Logout Error", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth State Changed. User:", u || "None");
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Firestore Data Sync ---
  useEffect(() => {
    if (!user) return;

    setDataLoading(true);
    const plansRef = collection(db, "users", user.uid, "plans");
    const unsubscribe = onSnapshot(
      plansRef,
      (snapshot) => {
        const plansData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by start date descending (newest first)
        const sorted = plansData.sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate),
        );
        setPlans(sorted);
        setDataLoading(false);
      },
      (err) => {
        console.error("Firestore Error", err);
        setError("Connection error. Please try again later.");
        setDataLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const savePlan = async (planData) => {
    if (!user) return;
    setSavingPlan(true);
    try {
      const plansRef = collection(db, "users", user.uid, "plans");
      if (selectedPlanId && view === "edit") {
        await updateDoc(doc(plansRef, selectedPlanId), planData);
      } else {
        await addDoc(plansRef, {
          ...planData,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
      setView("list");
      setSelectedPlanId(null);
    } catch (err) {
      setError("Failed to save plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (id) => {
    if (!user || !window.confirm("Delete this weekly plan?")) return;
    setDeletingPlan(true);
    try {
      const planDocRef = doc(db, "users", user.uid, "plans", id);
      await deleteDoc(planDocRef);
      if (selectedPlanId === id) {
        setView("list");
        setSelectedPlanId(null);
      }
    } catch (err) {
      setError("Failed to delete plan.");
    } finally {
      setDeletingPlan(false);
    }
  };

  const updateActionStatus = async (planId, actionIndex, newStatus) => {
    if (!user) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const key = `${planId}-${actionIndex}`;
    setUpdatingActions((prev) => ({ ...prev, [key]: true }));

    const newActions = [...plan.actions];
    newActions[actionIndex].status = newStatus;

    try {
      const planDocRef = doc(db, "users", user.uid, "plans", planId);

      await updateDoc(planDocRef, {
        actions: newActions,
      });
    } catch (err) {
      console.error("Update Error:", err);
      setError("Failed to update status.");
    } finally {
      setUpdatingActions((prev) => ({ ...prev, [key]: false }));
    }
  };
  const cycleStatus = (planId, actionIndex) => {
    const plan = plans.find((p) => p.id === planId);
    const currentStatus = plan.actions[actionIndex].status;
    let nextStatus;

    if (currentStatus === STATUS.NOT_YET) nextStatus = STATUS.PENDING;
    else if (currentStatus === STATUS.PENDING) nextStatus = STATUS.FINISHED;
    else nextStatus = STATUS.NOT_YET;

    updateActionStatus(planId, actionIndex, nextStatus);
  };

  // --- Derived State ---
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // --- Views ---
  const ListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Overview
          </h1>
          <p className="text-sm text-slate-500">
            Track high-level productivity across weeks.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold"
        >
          <Plus size={18} />
          <span className="hidden md:block">Create New Plan</span>
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-900">
            No weekly plans found
          </h3>
          <p className="text-slate-500 mt-1 max-w-xs mx-auto">
            Start by creating your first action plan for the upcoming week.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const finishedCount = plan.actions.filter(
              (a) => a.status === STATUS.FINISHED,
            ).length;
            const percentage =
              plan.actions.length > 0
                ? (finishedCount / plan.actions.length) * 100
                : 0;

            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setView("detail");
                }}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {plan.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
                      Deadline:{" "}
                      {new Date(plan.endDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${percentage === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}
                    >
                      {percentage === 100
                        ? "COMPLETE"
                        : `${plan.actions.length} ACTIONS`}
                    </span>
                  </div>
                </div>

                <ProgressBar percentage={percentage} />

                <div className="mt-4 space-y-2">
                  {plan.actions.slice(0, 3).map((action, idx) => {
                    const getStatusIcon = (status) => {
                      switch (status) {
                        case STATUS.FINISHED:
                          return (
                            <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2
                                size={10}
                                className="text-emerald-600"
                              />
                            </div>
                          );
                        case STATUS.PENDING:
                          return (
                            <div className="w-4 h-4 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                              <Clock size={10} className="text-amber-600" />
                            </div>
                          );
                        default:
                          return (
                            <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <Circle size={10} className="text-slate-400" />
                            </div>
                          );
                      }
                    };

                    const getStatusStyle = (status) => {
                      switch (status) {
                        case STATUS.FINISHED:
                          return "text-emerald-800 line-through opacity-60";
                        case STATUS.PENDING:
                          return "text-amber-800 font-medium";
                        default:
                          return "text-slate-600";
                      }
                    };

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        {getStatusIcon(action.status)}
                        <span
                          className={`text-xs truncate leading-tight ${getStatusStyle(action.status)}`}
                        >
                          {action.name}
                        </span>
                      </div>
                    );
                  })}
                  {plan.actions.length > 3 && (
                    <div className="text-xs text-slate-400 pl-7 italic">
                      +{plan.actions.length - 3} more actions
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 size={8} className="text-white" />
                        </div>
                        {finishedCount} Done
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                          <AlertCircle size={8} className="text-white" />
                        </div>
                        {
                          plan.actions.filter(
                            (a) => a.status === STATUS.PENDING,
                          ).length
                        }{" "}
                        Active
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {
                        plan.actions.filter((a) => a.status === STATUS.NOT_YET)
                          .length
                      }{" "}
                      Pending
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const PlanFormView = ({ initialData = null }) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [startDate, setStartDate] = useState(
      initialData?.startDate || new Date().toISOString().split("T")[0],
    );
    const [endDate, setEndDate] = useState(initialData?.endDate || "");
    const [actions, setActions] = useState(
      initialData?.actions || [
        { id: crypto.randomUUID(), name: "", status: STATUS.NOT_YET },
      ],
    );

    const addAction = () => {
      setActions([
        ...actions,
        { id: crypto.randomUUID(), name: "", status: STATUS.NOT_YET },
      ]);
    };

    const removeAction = (index) => {
      setActions(actions.filter((_, i) => i !== index));
    };

    const updateActionName = (index, value) => {
      const newActions = [...actions];
      newActions[index].name = value;
      setActions(newActions);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const validActions = actions.filter((a) => a.name.trim() !== "");
      if (!title || !endDate || validActions.length === 0) {
        alert("Please provide a title, deadline, and at least one action.");
        return;
      }
      savePlan({ title, startDate, endDate, actions: validActions });
    };

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {initialData ? "Edit Weekly Plan" : "Create Weekly Plan"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Week Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Week 12 - Product Launch Focus"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs sm:text-sm font-medium"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs sm:text-sm font-medium"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Key Actions
                </label>
                <button
                  type="button"
                  onClick={addAction}
                  className="text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus size={14} /> Add Action
                </button>
              </div>

              <div className="space-y-3">
                {actions.map((action, idx) => (
                  <div key={action.id} className="flex gap-2 group">
                    <input
                      type="text"
                      placeholder="Identify specific outcome..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={action.name}
                      onChange={(e) => updateActionName(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPlan}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-4 flex items-center justify-center gap-2"
            >
              {savingPlan ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : initialData ? (
                "Update Plan"
              ) : (
                "Save Weekly Plan"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const DetailView = () => {
    if (!selectedPlan) return null;

    const finished = selectedPlan.actions.filter(
      (a) => a.status === STATUS.FINISHED,
    );
    const pending = selectedPlan.actions.filter(
      (a) => a.status === STATUS.PENDING,
    );
    const notStarted = selectedPlan.actions.filter(
      (a) => a.status === STATUS.NOT_YET,
    );
    const progress = (finished.length / selectedPlan.actions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft size={18} /> All Plans
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setView("edit")}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg border border-transparent hover:border-slate-200"
            >
              Edit Plan
            </button>
            <button
              onClick={() => deletePlan(selectedPlan.id)}
              disabled={deletingPlan}
              className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg border border-transparent hover:border-rose-100 flex items-center justify-center"
            >
              {deletingPlan ? (
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedPlan.title}
                </h2>
                {/* <div className="flex items-center gap-4 mt-3 text-sm font-semibold">
                  <span className="text-slate-400 uppercase tracking-widest">
                    Single Deadline:
                  </span>
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                    {new Date(selectedPlan.endDate).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "long", year: "numeric" },
                    )}
                  </span>
                </div> */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                      Start:
                    </span>
                    <span className="text-slate-700">
                      {new Date(selectedPlan.startDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                      Deadline:
                    </span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                      {new Date(selectedPlan.endDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right min-w-[140px]">
                <div className="text-4xl font-black text-indigo-600 leading-none">
                  {Math.round(progress)}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Efficiency
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Progress Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xl font-bold text-slate-900">
                  {selectedPlan.actions.length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <div className="text-xl font-bold text-emerald-700">
                  {finished.length}
                </div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  Finished
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="text-xl font-bold text-amber-700">
                  {pending.length}
                </div>
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                  Pending
                </div>
              </div>
            </div>

            {/* Action List */}
            <div>
              <h3 className="text-xs text-slate-400 uppercase mb-4">
                Action Pipeline
              </h3>
              <div className="space-y-3">
                {selectedPlan.actions.map((action, idx) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => cycleStatus(selectedPlan.id, idx)}
                        disabled={updatingActions[`${selectedPlan.id}-${idx}`]}
                        className={`transition-colors flex-shrink-0 ${
                          action.status === STATUS.FINISHED
                            ? "text-emerald-500"
                            : action.status === STATUS.PENDING
                              ? "text-amber-500"
                              : "text-slate-300"
                        }`}
                      >
                        {updatingActions[`${selectedPlan.id}-${idx}`] ? (
                          <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : action.status === STATUS.FINISHED ? (
                          <CheckCircle2 size={24} />
                        ) : action.status === STATUS.PENDING ? (
                          <Clock size={24} />
                        ) : (
                          <Circle size={24} />
                        )}
                      </button>
                      <span
                        className={`text-slate-700 ${action.status === STATUS.FINISHED ? "line-through text-slate-400 font-normal" : ""}`}
                      >
                        {action.name}
                      </span>
                    </div>

                    <button
                      onClick={() => cycleStatus(selectedPlan.id, idx)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${STATUS_COLORS[action.status]}`}
                    >
                      {STATUS_LABELS[action.status]}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-900 rounded-xl text-white">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <AlertCircle className="text-indigo-300" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Deadline Focus</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    All {selectedPlan.actions.length} items in this list are
                    tethered to the{" "}
                    {new Date(selectedPlan.endDate).toLocaleDateString()}{" "}
                    deadline. Prioritize execution over perfection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
            <BarChart3 size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Weekly Action Planner
          </h1>
          <p className="text-slate-500 mb-8">
            Sign in to sync your strategic goals across devices.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // --- Main Layout ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView("list")}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BarChart3 size={18} />
            </div>
            <span className="hidden sm:block font-black text-lg tracking-tighter uppercase italic">
              Weekly Action
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setView("list")}
              className={`text-sm font-bold tracking-widest uppercase flex items-center gap-2 transition-colors ${view === "list" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            {user && (
              <div
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden"
                title={user.uid}
              >
                {user.uid.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {loading || dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Loading...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
            <AlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
            <h3 className="text-rose-900 font-bold">System Error</h3>
            <p className="text-rose-600 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold"
            >
              Reload App
            </button>
          </div>
        ) : (
          <>
            {view === "list" && <ListView />}
            {view === "create" && <PlanFormView />}
            {view === "edit" && <PlanFormView initialData={selectedPlan} />}
            {view === "detail" && <DetailView />}
          </>
        )}
      </main>

      {/* Footer / Meta */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>© 2026 Action Planning</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Strategic Execution</span>
        </div>
        <div className="text-[10px] font-medium max-w-xs text-center md:text-right">
          Focus on high-level outcomes. A single deadline for all weekly actions
          reduces decision fatigue.
        </div>
      </footer>
    </div>
  );
};

export default App;
