"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-[#1A1518] group/calendar p-3 rounded-lg shadow-lg border border-[#2A2428] [--cell-size:2.25rem] min-w-[260px]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-3 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 text-[#E5E5E5] hover:text-[#C40F5A] hover:bg-[#2A2428]",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 text-[#E5E5E5] hover:text-[#C40F5A] hover:bg-[#2A2428]",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-[#C40F5A] border-[#2A2428] shadow-xs has-focus:ring-[#C40F5A]/50 has-focus:ring-[3px] relative rounded-md border bg-[#1A1518]",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium text-[#E5E5E5]",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-[#A0A0A0] flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex justify-between w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-[#A0A0A0] flex-1 select-none rounded-md text-[0.8rem] font-normal h-[--cell-size] flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative h-full w-full select-none p-0 text-center flex-1",
          defaultClassNames.day
        ),
        range_start: cn(
          "data-[selected=true]:bg-transparent",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "data-[selected=true]:bg-transparent",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "data-[selected=true]:bg-transparent",
          defaultClassNames.range_end
        ),
        today: cn(
          "data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        
        outside: cn(
          "text-[#3A3438] aria-selected:text-[#3A3438]",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-[#3A3438] opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelectedSingle = modifiers.selected && 
                           !modifiers.range_start && 
                           !modifiers.range_end && 
                           !modifiers.range_middle;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected ? "true" : "false"}
      data-selected-single={isSelectedSingle ? "true" : "false"} 
      data-range-start={modifiers.range_start ? "true" : "false"}
      data-range-end={modifiers.range_end ? "true" : "false"}
      data-range-middle={modifiers.range_middle ? "true" : "false"}
      data-today={modifiers.today ? "true" : "false"}
      
      className={cn(
        "h-[--cell-size] w-full p-0 flex flex-col justify-center items-center text-sm text-[#E5E5E5] hover:bg-[#2A2428] hover:text-white transition-colors",
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        "data-[selected-single=true]:bg-[#C40F5A] data-[selected-single=true]:text-white data-[selected-single=true]:rounded-md data-[selected-single=true]:hover:bg-[#A00D4A]",
        "data-[range-middle=true]:bg-[#C40F5A]/30 data-[range-middle=true]:text-white data-[range-middle=true]:rounded-none",
        "data-[range-start=true]:bg-[#C40F5A] data-[range-start=true]:text-white data-[range-start=true]:rounded-l-md data-[range-start=true]:rounded-r-none data-[range-start=true]:hover:bg-[#A00D4A]",
        "data-[range-end=true]:bg-[#C40F5A] data-[range-end=true]:text-white data-[range-end=true]:rounded-r-md data-[range-end=true]:rounded-l-none data-[range-end=true]:hover:bg-[#A00D4A]",
        "data-[today=true]:border data-[today=true]:border-[#C40F5A] data-[today=true]:text-[#F46CA4] data-[selected=false][data-today=true]:bg-[#C40F5A]/20",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:border-[#C40F5A] group-data-[focused=true]/day:ring-[#C40F5A]/50",
        
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }