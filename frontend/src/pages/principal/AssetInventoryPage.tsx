import React, { useState, useEffect } from 'react';
import { assetApi, InstitutionalAsset, InventoryItem } from '../../api/assets';
import { Package, Laptop, AlertTriangle, ArrowDownRight, ArrowUpRight, Plus, Search, Wrench } from 'lucide-react';

export const AssetInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'INVENTORY'>('ASSETS');
  const [assets, setAssets] = useState<InstitutionalAsset[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Asset creation modal
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('IT_EQUIPMENT');
  const [assetLocation, setAssetLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);

  // Inventory transaction modal
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [txType, setTxType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [txQuantity, setTxQuantity] = useState<number>(1);
  const [txReason, setTxReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetData, invData] = await Promise.all([
        assetApi.getAssets(),
        assetApi.getInventoryItems(),
      ]);
      setAssets(assetData);
      setInventoryItems(invData);
    } catch (err) {
      console.error('Failed to fetch asset inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assetApi.createAsset({
        assetCode,
        name: assetName,
        category: assetCategory,
        location: assetLocation,
        purchaseCost: Number(purchaseCost),
      });
      setShowAssetModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create asset', err);
    }
  };

  const handleRecordTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assetApi.recordTransaction({
        inventoryItemId: selectedItemId,
        transactionType: txType,
        quantity: Number(txQuantity),
        reason: txReason,
      });
      setShowTxModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to record transaction', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            Institutional Asset & Consumables Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track equipment lifecycle, maintenance schedules, departmental assignments, and consumable stock thresholds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAssetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Fixed Asset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ASSETS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'ASSETS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Fixed Institutional Assets ({assets.length})
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'INVENTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Consumables & Supplies ({inventoryItems.length})
        </button>
      </div>

      {/* Fixed Assets Tab */}
      {activeTab === 'ASSETS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Asset Code & Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Location</th>
                  <th className="px-6 py-3 font-semibold">Assigned To</th>
                  <th className="px-6 py-3 font-semibold">Purchase Cost</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-medium">
                      <div className="font-bold text-slate-800">{ast.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{ast.assetCode}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{ast.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{ast.location}</td>
                    <td className="px-6 py-4 text-xs">
                      {ast.assignedToUser ? (
                        <span className="font-medium text-indigo-700">
                          {ast.assignedToUser.firstName} {ast.assignedToUser.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {ast.purchaseCost ? `₹${ast.purchaseCost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          ast.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ast.status === 'ASSIGNED'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ast.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumable Inventory Tab */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTxModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <ArrowDownRight className="w-4 h-4" />
              Record Stock In / Stock Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
                  item.isLowStock ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.itemCode}
                    </span>
                    {item.isLowStock && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mt-2">{item.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{item.category} • Location: {item.location || 'General Store'}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Current Balance</div>
                    <div className="text-xl font-black text-slate-800">
                      {item.currentQuantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Min Threshold</div>
                    <div className="text-sm font-semibold text-slate-600">{item.minThresholdQuantity} {item.unit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Creation Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Register Fixed Asset</h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    placeholder="e.g. AST-LAP-045"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="IT_EQUIPMENT">IT Equipment</option>
                    <option value="LAB_EQUIPMENT">Lab Equipment</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="AV_EQUIPMENT">AV / Projector</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Dell OptiPlex 7090 Desktop"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Location</label>
                  <input
                    type="text"
                    required
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. Computer Lab 2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Record Stock Transaction</h3>
            <form onSubmit={handleRecordTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Choose item...</option>
                  {inventoryItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Balance: {i.currentQuantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="STOCK_IN">Stock In (Receipt)</option>
                    <option value="STOCK_OUT">Stock Out (Issue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Justification</label>
                <input
                  type="text"
                  required
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Issued to Examination Department"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
