import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Button,
    Calendar as AriaCalendar,
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    DateInput,
    DatePicker as AriaDatePicker,
    DateSegment,
    Dialog,
    Group,
    Heading,
    Popover,
} from 'react-aria-components';

export function DatePicker({ value, onChange, ...props }) {
    return (
        <AriaDatePicker
            value={value}
            onChange={onChange}
            className="group flex flex-col gap-1"
            {...props}
        >
            <Group className="relative flex w-full items-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition-all focus-within:border-champagne focus-within:ring-4 focus-within:ring-champagne/10">
                <DateInput className="flex flex-1 px-3 py-2.5">
                    {(segment) => (
                        <DateSegment
                            segment={segment}
                            className="rounded px-0.5 text-base tabular-nums text-gray-900 outline-none focus:bg-champagne/10 focus:text-champagne"
                        />
                    )}
                </DateInput>
                <Button className="mr-2 flex items-center justify-center rounded p-1 text-gray-500 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100">
                    <Calendar size={20} />
                </Button>
            </Group>
            <Popover
                className="z-50 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
                placement="bottom start"
            >
                <Dialog className="outline-none">
                    <AriaCalendar>
                        <header className="mb-4 flex items-center justify-between">
                            <Button
                                slot="previous"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <Heading className="text-sm font-semibold text-gray-900" />
                            <Button
                                slot="next"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                                <ChevronRight size={20} />
                            </Button>
                        </header>
                        <CalendarGrid className="border-separate border-spacing-1">
                            <CalendarGridHeader>
                                {(day) => (
                                    <CalendarHeaderCell className="text-xs font-medium text-gray-500">
                                        {day}
                                    </CalendarHeaderCell>
                                )}
                            </CalendarGridHeader>
                            <CalendarGridBody>
                                {(date) => (
                                    <CalendarCell
                                        date={date}
                                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm text-gray-900 outline-none transition-colors hover:bg-gray-100 focus:bg-champagne/10 focus:text-champagne selected:bg-champagne selected:text-white selected:hover:bg-champagne-hover disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent outside-month:text-gray-400"
                                    />
                                )}
                            </CalendarGridBody>
                        </CalendarGrid>
                    </AriaCalendar>
                </Dialog>
            </Popover>
        </AriaDatePicker>
    );
}
