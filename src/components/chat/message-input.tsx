"use client";

import { useState } from "react";

export function MessageInput() {
  const [value, setValue] = useState("");

  return (
    <div className="border-t border-[#ececec] bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002de3] text-white"
          type="button"
        >
          <svg
            fill="none"
            height="18"
            viewBox="0 0 18 18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3.5V14.5M3.5 9H14.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        <form
          className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#b7b7b7] bg-white px-4 py-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-6 text-[#171616] outline-none placeholder:text-[#959595]"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Message"
            value={value}
          />

          <button
            aria-label="Camera"
            className="text-[#171616]"
            type="button"
          >
            <svg
              fill="none"
              height="22"
              viewBox="0 0 22 22"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.417 7.333L7.792 5.5H14.208L15.583 7.333H18.333V16.5H3.667V7.333H6.417Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
              <circle
                cx="11"
                cy="11.917"
                r="2.75"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>

          <button
            aria-label="Voice"
            className="text-[#171616]"
            type="button"
          >
            <svg
              fill="none"
              height="22"
              viewBox="0 0 22 22"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 4.583A1.833 1.833 0 0 1 12.833 6.417V11A1.833 1.833 0 1 1 9.167 11V6.417A1.833 1.833 0 0 1 11 4.583Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.333 10.542A3.667 3.667 0 1 0 14.667 10.542M11 14.667V17.417M8.25 17.417H13.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
