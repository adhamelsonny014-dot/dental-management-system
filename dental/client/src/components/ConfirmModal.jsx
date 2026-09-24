const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="card w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-slate-900 text-lg mb-1">{title}</h3>
        <p className="text-dental-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
