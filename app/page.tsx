"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, onSnapshot, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const [user] = useAuthState(auth);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [noticeText, setNoticeText] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub1 = onSnapshot(query(collection(db, "notices"), orderBy("createdAt", "desc")), (snap) => {
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(collection(db, "events"), (snap) => {
      const now = new Date();
      const upcoming = snap.docs
        .map((d) => ({ id: d.id, title: d.data().title, start: d.data().start.toDate() }))
        .filter((e) => e.start >= now)
        .sort((a, b) => a.start - b.start)
        .slice(0, 3);
      setEvents(upcoming);
    });
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const postNotice = async () => {
    if (!noticeText.trim()) return;
    await addDoc(collection(db, "notices"), {
      text: noticeText,
      createdBy: user?.displayName,
      createdAt: new Date(),
    });
    setNoticeText("");
  };

  const deleteNotice = async (id: string) => {
    if (confirm("このお知らせを削除しますか？")) {
      await deleteDoc(doc(db, "notices", id));
    }
  };

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <button onClick={login} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg">
        Google&#12391;&#12525;&#12464;&#12452;&#12531;
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">&#12415;&#12435;&#12394;&#12398;&#12509;&#12540;&#12479;&#12523;</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.displayName}</span>
          <button onClick={() => signOut(auth)} className="text-sm text-gray-400 underline">&#12525;&#12464;&#12450;&#12454;&#12488;</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/calendar" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100">
          <div className="text-2xl mb-1">&#128197;</div>
          <div className="text-sm font-medium">&#12459;&#12524;&#12531;&#12480;&#12540;</div>
        </Link>
        <Link href="/goals" className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100">
          <div className="text-2xl mb-1">&#127919;</div>
          <div className="text-sm font-medium">&#30446;&#26631;&#31649;&#29702;</div>
        </Link>
        <Link href="/records" className="p-4 bg-orange-50 rounded-xl text-center hover:bg-orange-100">
          <div className="text-2xl mb-1">&#128202;</div>
          <div className="text-sm font-medium">&#20104;&#23450;&#12392;&#23455;&#32assistants;</div>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3">&#30452;&#36817;&#12398;&#12452;&#12505;&#12531;&#12488;</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">&#20104;&#23450;&#12373;&#12428;&#12390;&#12356;&#12427;&#12452;&#12505;&#12531;&#12488;&#12399;&#12354;&#12426;&#12414;&#12379;&#12435;</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium w-32 shrink-0">
                  {e.start.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                </div>
                <div className="text-sm">{e.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">&#12362;&#30693;&#12425;&#12379;&#25609;&#31295;&#26495;</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded-lg p-2 text-sm"
            placeholder="&#12362;&#30693;&#12425;&#12379;&#12434;&#25295;&#31295;&#12377;&#12427;..."
            value={noticeText}
            onChange={(e) => setNoticeText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postNotice()}
          />
          <button onClick={postNotice} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">&#25295;&#31295;</button>
        </div>
        <div className="space-y-2">
          {notices.map((n: any) => (
            <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{n.text}</p>
                <button onClick={() => deleteNotice(n.id)} className="text-xs text-gray-300 hover:text-red-400 shrink-0">&#21066;&#38500;</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{n.createdBy} · {n.createdAt?.toDate?.()?.toLocaleDateString("ja-JP")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}