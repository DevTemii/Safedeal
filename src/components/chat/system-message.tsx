interface SystemMessageProps {
  children: string;
}

export function SystemMessage({ children }: SystemMessageProps) {
  return (
    <div className="flex justify-center px-4">
      <div className="rounded-full border border-[#d8d8d8] bg-white px-3 py-1 text-[11px] font-medium leading-4 text-[#555555] shadow-[0px_4px_14px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </div>
  );
}
