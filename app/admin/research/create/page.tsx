"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { CircleNotch, ArrowLeft } from "@phosphor-icons/react"

export default function CreateResearchPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("Weekly FBM Research")
    const [description, setDescription] = useState("")
    const [searchWindowDays, setSearchWindowDays] = useState("10")
    const [minFindings, setMinFindings] = useState("15")
    const [reRunOnFailure, setReRunOnFailure] = useState(true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error("Name is required")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/admin/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    searchWindowDays: parseInt(searchWindowDays, 10) || 10,
                    minFindings: parseInt(minFindings, 10) || 15,
                    reRunOnFailure,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to create research config")
            }

            const data = await res.json()
            toast.success("Research config created with default templates and prompts")
            router.push(`/admin/research/${data.id}`)
        } catch (error: any) {
            toast.error(error.message || "Failed to create research config")
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
                    href="/admin/research"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Research
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Create Research Config</h1>
                <p className="text-muted-foreground text-xs">
                    Set up a new research pipeline. A Knowledge Base, 5 default section templates, and starter prompts will be created automatically.
                </p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Research Settings</CardTitle>
                    <CardDescription className="text-xs">
                        Configure the research pipeline parameters.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Weekly FBM Research"
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What this research pipeline does..."
                                className="text-xs"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="searchWindowDays" className="text-xs">
                                    Search Window (days)
                                </Label>
                                <Input
                                    id="searchWindowDays"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={searchWindowDays}
                                    onChange={(e) => setSearchWindowDays(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minFindings" className="text-xs">
                                    Minimum Findings
                                </Label>
                                <Input
                                    id="minFindings"
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={minFindings}
                                    onChange={(e) => setMinFindings(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="reRunOnFailure"
                                type="checkbox"
                                checked={reRunOnFailure}
                                onChange={(e) => setReRunOnFailure(e.target.checked)}
                                className="h-3.5 w-3.5"
                            />
                            <Label htmlFor="reRunOnFailure" className="text-xs cursor-pointer">
                                Auto re-run with wider window if findings are insufficient
                            </Label>
                        </div>

                        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                            <p className="font-medium mb-1">What gets created automatically:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Knowledge Base with default brand voice</li>
                                <li>5 section templates (Expert Tip, Marketing Tip, Community Spotlight, Funnel of the Week, Food for Thought)</li>
                                <li>Research prompt (1A) and Writing prompt (1B) with starter content</li>
                            </ul>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={saving} className="text-xs">
                                {saving && <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                Create Research Config
                            </Button>
                            <Link href="/admin/research">
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
