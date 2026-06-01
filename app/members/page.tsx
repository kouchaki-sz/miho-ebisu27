"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function GoalsPage() {
  const [user] = useAuthState(auth);
  const [goals, setGoals] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [tab, setTab] = useState<"monthly" | "yearly">("monthly");
  const [newGoal, setNewGoal] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(collection(db, "goals"), orderBy("createdAt", "desc")), (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(query(collection(db, "members"), orderBy("createdAt", "asc")), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMembers(list);
      if (!selectedMember && list.length > 0) setSelectedMember((list[0] as any).name);
    });
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const addGoal = async () => {
    if (!newGoal.trim() || !selectedMember) return;
    await addDoc(collection(db, "goals"), {
      title: newGoal,
      type: tab,
      period: tab === "monthly" ? period : year,
      createdBy: selectedMember,
      inputBy: user?.displayName,
      createdAt: new Date(),
    });
    setNewGoal("");
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setEditingTitle(g.title);
  };

  const saveEdit = async () => {
    if (!editingTitle.trim() || !editingId) return;
    await updateDoc(doc(db, "goals", editingId), { title: editingTitle });
    setEditingId(null);
    setEditingTitle("");
  };

  const deleteGoal = async (id: string) => {
    if (confirm("Delete this goal?")) {
      await deleteDoc(doc(db, "goals", id));
    }
  };

  const filtered = goals.filter((g: any) =>
    g.type === tab && g.period === (tab === "monthly" ? period : year)
  );

  const grouped = filtered.reduce((acc: any, g: any) => {
    acc[g.createdBy] = acc[g.createdBy] || [];
    acc[g.createdBy].push(g);
    return acc;
  }, {});

  if (!user) return <div className="flex items-center justify-center h-screen">Login required</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">&larr; Home</Link>
        <h1 className="text-2xl font-medium">Goals</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "monthly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Monthly
        </button>
        <button onClick={() => setTab("yearly")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "yearly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Yearly
        </button>
      </div>

      <div className="mb-4">
        {tab === "monthly" ? (
          <input type="month" className="border rounded-lg p-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)} />
        ) : (
          <select className="border rounded-lg p-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <select className="border rounded-lg p-2 text-sm" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
          {members.map((m: any) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <input
          className="flex-1 border rounded-lg p-2 text-sm"
          placeholder="Enter goal..."
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
        />
        <button onClick={addGoal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-orange-500 mb-4">
          Please add members in <Link href="/members" className="underline">Member Management</Link> first.
        </p>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-gray-400">No goals for this period</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([name, gs]: any) => (
            <div key={name}>
              <h2 className="text-sm font-medium text-gray-500 mb-2">{name}</h2>
              <div className="space-y-2">
                {gs.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editingId === g.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          className="flex-1 border rounded-lg p-1 text-sm"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          autoFocus
                        />
                        <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded-lg text-xs">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{g.title}</span>
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(g)} className="text-xs text-gray-400 hover:text-blue-500">Edit</button>
                          <button onClick={() => deleteGoal(g.id)} className="text-xs text-gray-300 hover:text-red-400">Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}