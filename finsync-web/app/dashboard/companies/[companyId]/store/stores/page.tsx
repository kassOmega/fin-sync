"use client";
import Loading from "@/components/Loading";
import { storeService } from "@/lib/services/store";
import type { Store } from "@/lib/services/types";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Building, Package, Plus, Settings, Trash2, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function StoresPage() {
  const params = useParams();
  const cid = Number(params.companyId);
  const { hasRole } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [f, setF] = useState({ name: "", desc: "", kid: "" });

  const refresh = useCallback(async () => {
    try { setStores(await storeService.listStores(cid)); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  }, [cid]);

  useEffect(() => { if (cid) refresh(); }, [cid, refresh]);

  const openNew = () => { setEditing(null); setF({ name: "", desc: "", kid: "" }); setModal(true); };
  const openEdit = (s: Store) => {
    setEditing(s);
    setF({ name: s.name, desc: s.description || "", kid: s.storekeeperId ? String(s.storekeeperId) : "" });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto: Record<string, unknown> = { name: f.name };
      if (f.desc) dto.description = f.desc;
      if (f.kid) dto.storekeeperId = Number(f.kid);
      if (editing) await storeService.updateStore(cid, editing.id, dto as any);
      else await storeService.createStore(cid, dto as any);
      toast.success(editing ? "Updated" : "Created");
      setModal(false); refresh();
    } catch { toast.error("Failed"); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete? Must be empty.")) return;
    try { await storeService.deleteStore(cid, id); toast.success("Deleted"); refresh(); }
    catch { toast.error("Failed"); }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        {hasRole([SystemRole.Owner]) && (
          <button onClick={openNew} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-1.5 hover:bg-indigo-700">
            <Plus className="h-4 w-4"/> New Store
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {s.projectId ? <Package className="h-5 w-5 text-orange-600"/> : <Building className="h-5 w-5 text-indigo-600"/>}
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
              </div>
              {hasRole([SystemRole.Owner]) && (
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(s)} className="p-1 text-gray-400 hover:text-indigo-600"><Settings className="h-4 w-4"/></button>
                  <button onClick={()=>del(s.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </div>
              )}
            </div>
            {s.description && <p className="text-sm text-gray-500 mb-3">{s.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5"/>{s._count?.items??0} items</span>
              {s.storekeeper ? <span className="flex items-center gap-1"><User className="h-3.5 w-3.5"/>{s.storekeeper.name}</span> : <span className="italic text-gray-400">No keeper</span>}
            </div>
            <div className="mt-3 flex gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.projectId?"bg-orange-100 text-orange-700":"bg-blue-100 text-blue-700"}`}>{s.projectId?`Project: ${s.project?.name||s.projectId}`:"Company"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{s.isActive?"Active":"Inactive"}</span>
            </div>
          </div>
        ))}
        {stores.length===0&&<div className="col-span-full text-center py-12 text-gray-500"><Building className="h-12 w-12 mx-auto mb-3 text-gray-300"/><p>No stores yet.</p></div>}
      </div>
  if (loading) return <Loading />;

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing?"Edit Store":"Create Store"}</h2>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" placeholder="e.g. Main Store"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Storekeeper ID</label><input type="number" value={f.kid} onChange={e=>setF({...f,kid:e.target.value})} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" placeholder="Optional"/></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setModal(false)} className="px-4 py-2 text-gray-600">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{editing?"Save":"Create"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}