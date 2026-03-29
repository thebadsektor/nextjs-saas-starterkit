"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CircleNotch, ArrowLeft } from "@phosphor-icons/react"

function getNextPublishDay() {
    const today = new Date()
    const dow = today.getDay()
    const publishDays = [1, 3, 5] // Mon, Wed, Fri
    let target = publishDays.find((d) => d > dow)
    if (target === undefined) target = publishDays[0] // wrap to Monday
    const daysAhead = (target - dow + 7) % 7 || 7
    const date = new Date(today)
    date.setDate(today.getDate() + daysAhead)
    const dayMap: Record<number, string> = { 1: "MONDAY", 3: "WEDNESDAY", 5: "FRIDAY" }
    return { day: dayMap[target], date }
}

function formatDateForInput(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function formatDateForTitle(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0")
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const y = date.getFullYear()
    return `${d}/${m}/${y}`
}

function buildTitle(dateStr: string, num: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr + "T00:00:00")
    if (isNaN(date.getTime())) return ""
    return `${formatDateForTitle(date)} Draft-${num || "?"}`
}

export default function CreateDigestPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [loadingDefaults, setLoadingDefaults] = useState(true)

    const [digestNumber, setDigestNumber] = useState("")
    const [publishDay, setPublishDay] = useState("")
    const [publishDate, setPublishDate] = useState("")
    const [title, setTitle] = useState("")

    // Fetch smart defaults on mount
    useEffect(() => {
        async function loadDefaults() {
            try {
                const nextPublish = getNextPublishDay()

                // Try to fetch the next digest number
                let nextNum = ""
                try {
                    const res = await fetch("/api/admin/digests/next-number")
                    if (res.ok) {
                        const data = await res.json()
                        nextNum = String(data.nextNumber ?? "")
                    }
                } catch {
                    // Silently fail - user can enter manually
                }

                const dateStr = formatDateForInput(nextPublish.date)
                setPublishDay(nextPublish.day)
                setPublishDate(dateStr)
                if (nextNum) {
                    setDigestNumber(nextNum)
                    setTitle(buildTitle(dateStr, nextNum))
                }
            } finally {
                setLoadingDefaults(false)
            }
        }
        loadDefaults()
    }, [])

    // Auto-update title when number or date changes
    useEffect(() => {
        if (!loadingDefaults && publishDate && digestNumber) {
            setTitle(buildTitle(publishDate, digestNumber))
        }
    }, [publishDate, digestNumber, loadingDefaults])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!digestNumber || !publishDay || !publishDate) {
            toast.error("Please fill in all required fields")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/admin/digests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    digestNumber: parseInt(digestNumber, 10),
                    publishDay,
                    publishDate,
                    title: title || null,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to create digest")
            }

            const data = await res.json()
            toast.success("Digest created successfully")
            router.push(`/admin/digests/${data.id}`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create digest")
        } finally {
            setSaving(false)
        }
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

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <Link
                    href="/admin/digests"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Digests
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Create New Digest</h1>
                <p className="text-muted-foreground text-xs">Set up a new email digest issue.</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Digest Details</CardTitle>
                    <CardDescription className="text-xs">
                        Fill in the basic information for this digest issue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingDefaults ? (
                        <div className="flex items-center justify-center py-10">
                            <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="digestNumber" className="text-xs">
                                    Digest Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="digestNumber"
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 42"
                                    value={digestNumber}
                                    onChange={(e) => setDigestNumber(e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="publishDay" className="text-xs">
                                    Publish Day <span className="text-red-500">*</span>
                                </Label>
                                <Select value={publishDay} onValueChange={setPublishDay} required>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Select a day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONDAY">Monday</SelectItem>
                                        <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                                        <SelectItem value="FRIDAY">Friday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="publishDate" className="text-xs">
                                    Publish Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="publishDate"
                                    type="date"
                                    value={publishDate}
                                    onChange={(e) => setPublishDate(e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs">
                                    Title <span className="text-muted-foreground">(auto-generated)</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="e.g. 29/03/2026 Draft-42"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={saving} className="text-xs">
                                    {saving && <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                    Create Digest
                                </Button>
                                <Link href="/admin/digests">
                                    <Button type="button" variant="outline" className="text-xs">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
