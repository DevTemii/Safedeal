interface DayDividerProps {
  children: string;
}

export function DayDivider({ children }: DayDividerProps) {
  return (
    <div className="flex justify-center">
      <div className="flex h-[21px] min-w-[44px] items-center justify-center rounded-[22px] border border-[#979797] bg-white px-3">
        <span className="text-[10px] font-semibold leading-none text-black">
          {children}
        </span>
      </div>
    </div>
  );
}
