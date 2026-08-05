#!/usr/bin/env python3
from pathlib import Path

path = Path("finsync-web/app/dashboard/companies/[companyId]/work-positions/page.tsx")
content = path.read_text()

# 1. Add allowanceDrafts state
old = '  const [posForm, setPosForm] = useState({ name: "", isActive: true });'
new = old + '\n  const [allowanceDrafts, setAllowanceDrafts] = useState<\n    Array<{ name: string; amount: string; isTaxable: boolean }>\n  >([]);'
if old in content:
    content = content.replace(old, new, 1)

# 2. Send allowances when creating position
old2 = '      } else {\n        await api.post(`/companies/${companyId}/work-positions`, {\n          name: posForm.name.trim(),\n        });\n        toast.success("Work position created");\n      }'
new2 = '      } else {\n        await api.post(`/companies/${companyId}/work-positions`, {\n          name: posForm.name.trim(),\n          allowances: allowanceDrafts\n            .filter((a) => a.name.trim() && a.amount)\n            .map((a) => ({\n              name: a.name.trim(),\n              amount: parseFloat(a.amount),\n              isTaxable: a.isTaxable,\n              effectiveFrom: new Date().toISOString().split("T")[0],\n            })),\n        });\n        toast.success("Work position created");\n      }'
if old2 in content:
    content = content.replace(old2, new2, 1)

# 3. Reset drafts when modal closes
old3 = '    setPositionModal(false);\n      setEditingPosition(null);\n      setPosForm({ name: "", isActive: true });'
new3 = old3 + '\n      setAllowanceDrafts([]);'
if old3 in content:
    content = content.replace(old3, new3, 1)

# 4. Reset drafts when Add Position button clicked
old4 = '          onClick={() => {\n            setEditingPosition(null);\n            setPosForm({ name: "", isActive: true });\n            setPositionModal(true);\n          }}'
new4 = '          onClick={() => {\n            setEditingPosition(null);\n            setPosForm({ name: "", isActive: true });\n            setAllowanceDrafts([]);\n            setPositionModal(true);\n          }}'
if old4 in content:
    content = content.replace(old4, new4, 1)

# 5. Insert allowance repeater UI in the Add Position modal (before Save button)
old5 = '              <div className="flex justify-end gap-3">\n                <button\n                  onClick={() => setPositionModal(false)}\n                  className="px-4 py-2 text-sm text-gray-600"\n                >\n                  Cancel\n                </button>\n                <button\n                  onClick={savePosition}\n                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"\n                >\n                  Save\n                </button>\n              </div>'
new5 = '''              {!editingPosition && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">
                      Allowance Options (optional)
                    </p>
                    <button
                      onClick={() =>
                        setAllowanceDrafts([
                          ...allowanceDrafts,
                          {
                            name: "",
                            amount: "",
                            isTaxable: true,
                          },
                        ])
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      + Add Allowance
                    </button>
                  </div>
                  {allowanceDrafts.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Add allowance options (e.g. Housing, Transport, Site Hazard)
                      that will apply to this position automatically.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allowanceDrafts.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-gray-50 rounded-md p-2"
                        >
                          <input
                            value={a.name}
                            onChange={(e) => {
                              const next = [...allowanceDrafts];
                              next[i] = { ...next[i], name: e.target.value };
                              setAllowanceDrafts(next);
                            }}
                            placeholder="Allowance name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={a.amount}
                            onChange={(e) => {
                              const next = [...allowanceDrafts];
                              next[i] = { ...next[i], amount: e.target.value };
                              setAllowanceDrafts(next);
                            }}
                            placeholder="Amount"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={a.isTaxable}
                              onChange={(e) => {
                                const next = [...allowanceDrafts];
                                next[i] = {
                                  ...next[i],
                                  isTaxable: e.target.checked,
                                };
                                setAllowanceDrafts(next);
                              }}
                              className="h-3.5 w-3.5"
                            />
                            Taxable
                          </label>
                          <button
                            onClick={() =>
                              setAllowanceDrafts(
                                allowanceDrafts.filter((_, j) => j !== i),
                              )
                            }
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPositionModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={savePosition}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>'''
if old5 in content:
    content = content.replace(old5, new5, 1)

path.write_text(content)
print("Done")