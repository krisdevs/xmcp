import { SVGProps } from "react";

export const Icons = {
  lightCheck: (props: SVGProps<SVGSVGElement>) => (
    <svg
      width="12"
      height="9"
      viewBox="0 0 12 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.3337 1L4.00033 8.33333L0.666992 5"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  copy: (props: SVGProps<SVGSVGElement>) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.66634 10.6666C1.93301 10.6666 1.33301 10.0666 1.33301 9.33325V2.66659C1.33301 1.93325 1.93301 1.33325 2.66634 1.33325H9.33301C10.0663 1.33325 10.6663 1.93325 10.6663 2.66659M6.66634 5.33325H13.333C14.0694 5.33325 14.6663 5.93021 14.6663 6.66659V13.3333C14.6663 14.0696 14.0694 14.6666 13.333 14.6666H6.66634C5.92996 14.6666 5.33301 14.0696 5.33301 13.3333V6.66659C5.33301 5.93021 5.92996 5.33325 6.66634 5.33325Z"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
