"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    CircleNotch,
    CaretLeft,
    CaretRight,
    CalendarBlank,
} from "@phosphor-icons/react"

type DigestStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "FAILED"

interface Digest {
    id: string
    digestNumber: number
    title: string | null
    publishDay: string
    publishDate: string
    status: DigestStatus
}

const STATUS_DOT_COLOR: Record<DigestStatus, string> = {
    DRAFT: "bg-gray-400",
    IN_REVIEW: "bg-yellow-400",
    APPROVED: "bg-blue-400",
    PUBLISHED: "bg-green-500",
    FAILED: "bg-red-500",
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOffset(year: number, month: number): number {
    // getDay() returns 0=Sun, 1=Mon... We want Monday=0
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
}

interface CalendarDay {
    date: number
    month: number // 0-indexed
    year: number
    isCurrentMonth: boolean
    isToday: boolean
    isWeekend: boolean
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
    const today = new Date()
    const todayDate = today.getDate()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOffset = getFirstDayOffset(year, month)

    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const days: CalendarDay[] = []

    // Previous month fill
    for (let i = firstDayOffset - 1; i >= 0; i--) {
        const date = daysInPrevMonth - i
        const col = days.length % 7
        days.push({
            date,
            month: prevMonth,
            year: prevYear,
            isCurrentMonth: false,
            isToday: date === todayDate && prevMonth === todayMonth && prevYear === todayYear,
            isWeekend: col >= 5,
        })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const col = days.length % 7
        days.push({
            date: d,
            month,
            year,
            isCurrentMonth: true,
            isToday: d === todayDate && month === todayMonth && year === todayYear,
            isWeekend: col >= 5,
        })
    }

    // Next month fill to complete last row
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    let nextDate = 1
    while (days.length % 7 !== 0) {
        const col = days.length % 7
        days.push({
            date: nextDate,
            month: nextMonth,
            year: nextYear,
            isCurrentMonth: false,
            isToday: nextDate === todayDate && nextMonth === todayMonth && nextYear === todayYear,
            isWeekend: col >= 5,
        })
        nextDate++
    }

    return days
}

function dateKey(year: number, month: number, date: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
}

export default function AdminSchedulePage() {
    const { data: session, isPending } = useSession()
    const [digests, setDigests] = useState<Digest[]>([])
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const [currentMonth, setCurrentMonth] = useState(now.getMonth())
    const [currentYear, setCurrentYear] = useState(now.getFullYear())

    const fetchDigests = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/digests?limit=50")
            if (!res.ok) throw new Error("Failed to fetch digests")
            const data = await res.json()
            setDigests(data.digests ?? [])
        } catch {
            toast.error("Failed to load digests")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user.role === "admin") {
            fetchDigests()
        }
    }, [session])

    const calendarDays = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentYear, currentMonth])

    // Index digests by date key for the displayed month
    const digestsByDate = useMemo(() => {
        const map: Record<string, Digest[]> = {}
        for (const digest of digests) {
            const d = new Date(digest.publishDate)
            const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
            if (!map[key]) map[key] = []
            map[key].push(digest)
        }
        return map
    }, [digests])

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
    }

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen text-xs">
                <CircleNotch className="h-4 w-4 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) return <RedirectToSignIn />
    if (session.user.role !== "admin") return <Unauthorized />

    const rows = calendarDays.length / 7

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
                <p className="text-muted-foreground text-xs">Digest publishing calendar</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                        <CalendarBlank className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={goToPrevMonth}>
                            <CaretLeft className="h-3.5 w-3.5 mr-0.5" />
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={goToNextMonth}>
                            Next
                            <CaretRight className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-0">
                                {WEEKDAY_HEADERS.map((h) => (
                                    <div key={h} className="text-center text-xs font-medium text-muted-foreground py-2">
                                        {h}
                                    </div>
                                ))}
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} className="border-t border-l first:border-l-0 p-2 min-h-[80px] [&:nth-child(7n+8)]:border-l-0">
                                        <Skeleton className="h-4 w-6 mb-2" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 border-b">
                                {WEEKDAY_HEADERS.map((h, i) => (
                                    <div
                                        key={h}
                                        className={`text-center text-xs font-medium text-muted-foreground py-2 ${
                                            i >= 5 ? "bg-muted/30" : ""
                                        }`}
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map((day, i) => {
                                    const key = dateKey(day.year, day.month, day.date)
                                    const dayDigests = digestsByDate[key] ?? []
                                    const isLastRow = i >= calendarDays.length - 7
                                    const isFirstCol = i % 7 === 0

                                    return (
                                        <div
                                            key={`${day.year}-${day.month}-${day.date}-${i}`}
                                            className={`min-h-[80px] border-t p-1.5 ${
                                                !isFirstCol ? "border-l" : ""
                                            } ${day.isWeekend ? "bg-muted/20" : ""}`}
                                        >
                                            {/* Day number */}
                                            <div className="flex items-center justify-end mb-0.5">
                                                <span
                                                    className={`text-xs leading-none inline-flex items-center justify-center ${
                                                        day.isToday
                                                            ? "w-6 h-6 rounded-full ring-2 ring-blue-500 text-blue-600 font-semibold"
                                                            : day.isCurrentMonth
                                                              ? "text-foreground"
                                                              : "text-muted-foreground/40"
                                                    }`}
                                                >
                                                    {day.date}
                                                </span>
                                            </div>

                                            {/* Digest badges */}
                                            <div className="space-y-0.5">
                                                {dayDigests.map((digest) => (
                                                    <Link
                                                        key={digest.id}
                                                        href={`/admin/digests/${digest.id}`}
                                                        className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted/60 transition-colors group"
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                                                STATUS_DOT_COLOR[digest.status]
                                                            }`}
                                                        />
                                                        <span className="text-[10px] leading-tight truncate text-foreground group-hover:underline">
                                                            #{digest.digestNumber}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
                <span className="font-medium">Status:</span>
                {(Object.entries(STATUS_DOT_COLOR) as [DigestStatus, string][]).map(([status, color]) => (
                    <span key={status} className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        {status === "IN_REVIEW" ? "In Review" : status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                ))}
            </div>
        </div>
    )
}
