"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function MembersPage() {
  const [user] = useAuthState(auth);
  const [members, setMembers] = useState<any[]>([]);
  const [newMember, setNewMember] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "members"), orderBy("createdAt", "asc")), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const addMember = async () => {
    if (!newMember.trim()) return;
    await addDoc(collection(db, "members"), {
      name: newMember,
      createdAt: new Date(),
    });
    setNewMember("");
  };

  const deleteMember = async (id) => {
    if (confirm("Delete this member?")) {
      await deleteDoc(doc(db, "members", id));
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen">繝ｭ繧ｰ繧､繝ｳ縺励※縺上□縺輔＞</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">竊・繝幢ｿｽE繝</Link>
        <h1 className="text-2xl font-medium">繝｡繝ｳ繝撰ｿｽE邂｡逅・/h1>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border rounded-lg p-2 text-sm"
          placeholder="繝｡繝ｳ繝撰ｿｽE蜷阪ｒ蜈･蜉・.."
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
        />
        <button onClick={addMember} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">霑ｽ蜉</button>
      </div>

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-gray-400">繝｡繝ｳ繝撰ｿｽE縺後∪縺縺・・ｽ・ｽ縺帙ｓ</p>
        ) : (
          members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">{m.name}</span>
              <button onClick={() => deleteMember(m.id)} className="text-xs text-gray-300 hover:text-red-400">蜑企勁</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

