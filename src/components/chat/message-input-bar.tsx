"use client";

import { useState } from "react";

export function MessageInputBar() {
  const [value, setValue] = useState("");

  return (
    <div className="bg-white px-[11px] pb-[calc(env(safe-area-inset-bottom)+11px)] pt-3">
      <div className="grid grid-cols-[41px_minmax(0,1fr)_24px_24px] items-center gap-[11px]">
        <button
          aria-label="Add"
          className="flex size-[41px] items-center justify-center rounded-full bg-[#002DE3] text-white"
          type="button"
        >
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 7V17M7 12H17"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
          </svg>
        </button>

        <form
          className="flex h-[35px] min-w-0 items-center rounded-[22px] border border-[#B7B7B7] bg-white px-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            className="w-full bg-transparent text-[14px] font-medium leading-none text-[#0F0F0F] outline-none placeholder:text-[#979797]"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Message"
            value={value}
          />
        </form>

        <button
          aria-label="Camera"
          className="flex size-6 items-center justify-center text-black"
          type="button"
        >
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 8.25L8.5 6.5H15.5L17 8.25H19.5V17.5H4.5V8.25H7Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>

        <button
          aria-label="Voice"
          className="flex size-6 items-center justify-center text-black"
          type="button"
        >
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5.5A2 2 0 0 1 14 7.5V12A2 2 0 1 1 10 12V7.5A2 2 0 0 1 12 5.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 11.5A4 4 0 1 0 16 11.5M12 15.5V18.5M9.5 18.5H14.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.6"
            />
            <path
              d="M18.5 8.25V15.75M21 10V14M3 10V14M5.5 8.25V15.75"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
