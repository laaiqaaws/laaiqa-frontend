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
        // Modern calendar styling with improved spacing and visual hierarchy
        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 group/calendar p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
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
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
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
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        
        // Ensure table is full width and border-collapse is maintained
        table: "w-full border-collapse",
        
        // FIX: Weekdays container must be flex and wide
        weekdays: cn("flex justify-between w-full", defaultClassNames.weekdays),
        
        // FIX: Weekday header (TH element) must be equally distributed
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal h-[--cell-size] flex items-center justify-center",
          defaultClassNames.weekday
        ),
        
        // FIX: Week row (TR element) must be flex and wide
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        
        // FIX: Day cell (TD element) must be equally distributed and zero padding/margin
        day: cn(
          "group/day relative h-full w-full select-none p-0 text-center flex-1", // Use flex-1 for equal distribution
          defaultClassNames.day
        ),
        
        // Selection/Range Classes (Keep minimal as DayButton handles color)
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
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
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
        // Ensure WeekNumber TD wrapper is correctly sized if used
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
        // Ensure the button fills the container and respects --cell-size for centering
        "h-[--cell-size] w-full p-0 flex flex-col justify-center items-center text-sm", 
        
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none [&>span]:text-xs [&>span]:opacity-70",
        
        defaultClassNames.day,
        
        // Selection Styles
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:rounded-md",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:rounded-none",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-l-md data-[range-start=true]:rounded-r-none",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-r-md data-[range-end=true]:rounded-l-none",
        
        // Today Styles
        "data-[today=true]:border data-[today=true]:border-accent data-[today=true]:text-accent-foreground data-[selected=false][data-today=true]:bg-accent/20",
        
        // Focus styles
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50",
        
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }