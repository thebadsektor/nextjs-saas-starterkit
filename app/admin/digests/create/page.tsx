"use client"

import { useState } from "react"
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

export default function CreateDigestPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [number, setNumber] = useState("")
    const [publishDay, setPublishDay] = useState("")
    const [publishDate, setPublishDate] = useState("")
    const [title, setTitle] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!number || !publishDay || !publishDate) {
            toast.error("Please fill in all required fields")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/admin/digests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    number: parseInt(number, 10),
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
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="number" className="text-xs">
                                Digest Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="number"
                                type="number"
                                min={1}
                                placeholder="e.g. 42"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
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
                                Title <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="e.g. The Power of Follow-Up"
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
                </CardContent>
            </Card>
        </div>
    )
}
