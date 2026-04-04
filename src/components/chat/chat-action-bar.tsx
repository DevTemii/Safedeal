export function ChatActionBar() {
  return (
    <div className="border-t border-[#ececec] bg-white px-4 py-3">
      <div className="mx-auto flex max-w-md items-center gap-2 overflow-x-auto">
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-[#878787]">
          Quick actions
        </span>
        <button
          className="shrink-0 rounded-full bg-[#002de3] px-4 py-2 text-[11px] font-semibold text-white"
          type="button"
        >
          Create deal
        </button>
        <button
          className="shrink-0 rounded-full border border-[#d7d7d7] bg-white px-4 py-2 text-[11px] font-medium text-[#171616]"
          type="button"
        >
          Delivery update
        </button>
      </div>
    </div>
  );
}
