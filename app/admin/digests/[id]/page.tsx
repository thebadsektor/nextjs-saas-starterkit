"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { RedirectToSignIn } from "@daveyplate/better-auth-ui"
import Unauthorized from "@/components/unauthorized"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
    CircleNotch,
    ArrowLeft,
    FloppyDisk,
    Trash,
    PaperPlaneTilt,
    Eye,
    EyeSlash,
    Warning,
    MagicWand,
    Plus,
    X,
    CheckCircle,
    UserCircle,
} from "@phosphor-icons/react"

type DigestStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "FAILED"
type SectionType = "EXPERT_TIP" | "MARKETING_TIP" | "COMMUNITY_SPOTLIGHT" | "FUNNEL_OF_THE_WEEK" | "FOOD_FOR_THOUGHT"

interface DigestSection {
    id?: string
    sectionType: SectionType
    order: number
    heading: string
    body: string
    sourceUrl: string
    sourceTitle: string
}

interface DigestApproval {
    id: string
    userId: string
    role: string
    approved: boolean
    approvedAt: string | null
    user: { id: string; name: string; email: string; image: string | null }
}

interface Digest {
    id: string
    digestNumber: number
    title: string | null
    publishDay: string
    status: DigestStatus
    publishDate: string
    subjectLine: string | null
    preHeader: string | null
    personalNote: string | null
    approvals: DigestApproval[]
    sections: DigestSection[]
}

const STATUS_BADGE: Record<DigestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    IN_REVIEW: { label: "In Review", variant: "outline", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
    APPROVED: { label: "Approved", variant: "outline", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    PUBLISHED: { label: "Published", variant: "outline", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    FAILED: { label: "Failed", variant: "destructive" },
}

const SECTION_ORDER: SectionType[] = [
    "EXPERT_TIP",
    "MARKETING_TIP",
    "COMMUNITY_SPOTLIGHT",
    "FUNNEL_OF_THE_WEEK",
    "FOOD_FOR_THOUGHT",
]

const SECTION_DISPLAY_NAMES: Record<SectionType, string> = {
    EXPERT_TIP: "FBM Expert Tip",
    MARKETING_TIP: "Marketing Tip of the Week",
    COMMUNITY_SPOTLIGHT: "Community Spotlight",
    FUNNEL_OF_THE_WEEK: "Funnel of the Week",
    FOOD_FOR_THOUGHT: "Food for Thought",
}

const DAY_LABELS: Record<string, string> = {
    MONDAY: "Monday",
    WEDNESDAY: "Wednesday",
    FRIDAY: "Friday",
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
    author: { label: "Author", className: "border-purple-500/30 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
    reviewer: { label: "Reviewer", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    proofreader: { label: "Proofreader", className: "border-orange-500/30 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
}

function makeEmptySections(): DigestSection[] {
    return SECTION_ORDER.map((type, i) => ({
        sectionType: type,
        order: i + 1,
        heading: "",
        body: "",
        sourceUrl: "",
        sourceTitle: "",
    }))
}

export default function DigestEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session, isPending } = useSession()
    const router = useRouter()

    const [digest, setDigest] = useState<Digest | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [generatingSection, setGeneratingSection] = useState<number | null>(null)

    // Form state
    const [subjectLine, setSubjectLine] = useState("")
    const [preHeader, setPreHeader] = useState("")
    const [title, setTitle] = useState("")
    const [personalNote, setPersonalNote] = useState("")
    const [sections, setSections] = useState<DigestSection[]>(makeEmptySections())

    // Add reviewer form state
    const [showAddReviewer, setShowAddReviewer] = useState(false)
    const [newReviewerEmail, setNewReviewerEmail] = useState("")
    const [newReviewerRole, setNewReviewerRole] = useState("reviewer")
    const [addingReviewer, setAddingReviewer] = useState(false)
    const [togglingApproval, setTogglingApproval] = useState<string | null>(null)

    const fetchDigest = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}`)
            if (!res.ok) throw new Error("Failed to fetch digest")
            const data: Digest = await res.json()

            setDigest(data)
            setSubjectLine(data.subjectLine ?? "")
            setPreHeader(data.preHeader ?? "")
            setTitle(data.title ?? "")
            setPersonalNote(data.personalNote ?? "")

            // Merge fetched sections with empty defaults
            const merged = SECTION_ORDER.map((type, i) => {
                const existing = data.sections?.find((s) => s.sectionType === type)
                return existing
                    ? { ...existing, order: i + 1 }
                    : { sectionType: type, order: i + 1, heading: "", body: "", sourceUrl: "", sourceTitle: "" }
            })
            setSections(merged)
        } catch (error) {
            toast.error("Failed to load digest")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user.role === "admin") {
            fetchDigest()
        }
    }, [session, id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectLine: subjectLine || null,
                    preHeader: preHeader || null,
                    title: title || null,
                    personalNote: personalNote || null,
                    sections: sections.map((s) => ({
                        id: s.id,
                        sectionType: s.sectionType,
                        order: s.order,
                        heading: s.heading,
                        body: s.body,
                        sourceUrl: s.sourceUrl,
                        sourceTitle: s.sourceTitle,
                    })),
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to save digest")
            }

            const updated = await res.json()
            setDigest(updated)
            toast.success("Digest saved successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to save digest")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete digest")

            toast.success("Digest deleted")
            router.push("/admin/digests")
        } catch (error: any) {
            toast.error(error.message || "Failed to delete digest")
            setDeleting(false)
        }
    }

    const handlePublish = async () => {
        setPublishing(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}/publish`, { method: "POST" })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to publish digest")
            }

            toast.success("Digest published successfully")
            fetchDigest()
        } catch (error: any) {
            toast.error(error.message || "Failed to publish digest")
        } finally {
            setPublishing(false)
        }
    }

    const updateSection = (index: number, field: keyof DigestSection, value: string) => {
        setSections((prev) => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    const handleGenerate = async (index: number) => {
        const section = sections[index]
        setGeneratingSection(index)
        try {
            const res = await fetch(`/api/admin/digests/${id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sectionType: section.sectionType,
                    topic: section.heading || undefined,
                }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to generate")
            }
            const { heading, body } = await res.json()
            setSections((prev) => {
                const updated = [...prev]
                updated[index] = { ...updated[index], heading, body }
                return updated
            })
            toast.success(`Generated ${SECTION_DISPLAY_NAMES[section.sectionType]} content`)
        } catch (error: any) {
            toast.error(error.message || "Failed to generate content")
        } finally {
            setGeneratingSection(null)
        }
    }

    const handleToggleApproval = async (approval: DigestApproval) => {
        setTogglingApproval(approval.id)
        try {
            const res = await fetch(`/api/admin/digests/${id}/approvals/${approval.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approved: !approval.approved }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to update approval")
            }
            await fetchDigest()
            toast.success(`Approval updated`)
        } catch (error: any) {
            toast.error(error.message || "Failed to update approval")
        } finally {
            setTogglingApproval(null)
        }
    }

    const handleAddReviewer = async () => {
        if (!newReviewerEmail.trim()) {
            toast.error("Please enter an email address")
            return
        }
        setAddingReviewer(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}/approvals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newReviewerEmail.trim(), role: newReviewerRole }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to add reviewer")
            }
            await fetchDigest()
            setNewReviewerEmail("")
            setNewReviewerRole("reviewer")
            setShowAddReviewer(false)
            toast.success("Reviewer added")
        } catch (error: any) {
            toast.error(error.message || "Failed to add reviewer")
        } finally {
            setAddingReviewer(false)
        }
    }

    const handleRemoveReviewer = async (approvalId: string) => {
        try {
            const res = await fetch(`/api/admin/digests/${id}/approvals/${approvalId}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to remove reviewer")
            }
            await fetchDigest()
            toast.success("Reviewer removed")
        } catch (error: any) {
            toast.error(error.message || "Failed to remove reviewer")
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

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        )
    }

    if (!digest) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <p className="text-muted-foreground text-sm">Digest not found.</p>
                <Link href="/admin/digests">
                    <Button variant="outline" className="text-xs">
                        <ArrowLeft className="mr-1.5 h-3 w-3" />
                        Back to Digests
                    </Button>
                </Link>
            </div>
        )
    }

    const statusConfig = STATUS_BADGE[digest.status]

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <Link
                    href="/admin/digests"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Digests
                </Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Digest #{digest.digestNumber} &mdash; {DAY_LABELS[digest.publishDay] ?? digest.publishDay}
                    </h1>
                    <Badge variant={statusConfig.variant} className={`text-[10px] py-0 px-1.5 font-normal ${statusConfig.className ?? ""}`}>
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} className="text-xs">
                    {saving ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FloppyDisk className="mr-1.5 h-3.5 w-3.5" />}
                    Save
                </Button>

                {digest.status === "APPROVED" && (
                    <Button onClick={handlePublish} disabled={publishing} variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                        {publishing ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="mr-1.5 h-3.5 w-3.5" />}
                        Publish
                    </Button>
                )}

                <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    className="text-xs"
                >
                    {showPreview ? <EyeSlash className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                    {showPreview ? "Hide Preview" : "Preview"}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-xs text-red-600 hover:text-red-700 ml-auto">
                            <Trash className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <Warning className="size-5 text-red-600" weight="bold" />
                                </div>
                                <AlertDialogTitle>Delete Digest</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                                Are you sure you want to delete Digest #{digest.digestNumber}? This action cannot be undone and will permanently remove the digest and all its sections.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting && <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                Confirm Deletion
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Preview Panel */}
            {showPreview && (
                <Card className="border-none shadow-sm bg-white dark:bg-muted/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {subjectLine && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Subject</p>
                                <p className="text-sm font-semibold">{subjectLine}</p>
                            </div>
                        )}
                        {preHeader && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pre-Header</p>
                                <p className="text-sm text-muted-foreground">{preHeader}</p>
                            </div>
                        )}
                        {title && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Title</p>
                                <p className="text-base font-bold">{title}</p>
                            </div>
                        )}
                        {personalNote && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Personal Note</p>
                                <p className="text-sm whitespace-pre-wrap">{personalNote}</p>
                            </div>
                        )}
                        <hr className="border-muted" />
                        {sections.map((section) => (
                            <div key={section.sectionType} className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    {SECTION_DISPLAY_NAMES[section.sectionType]}
                                </p>
                                {section.heading && <p className="text-sm font-semibold">{section.heading}</p>}
                                {section.body && <p className="text-sm whitespace-pre-wrap">{section.body}</p>}
                                {section.sourceUrl && (
                                    <p className="text-xs text-blue-600">
                                        Source: {section.sourceTitle || section.sourceUrl}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Subject / Pre-Header / Title */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Email Header</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subjectLine" className="text-xs">Subject Line</Label>
                        <Input
                            id="subjectLine"
                            value={subjectLine}
                            onChange={(e) => setSubjectLine(e.target.value)}
                            placeholder="Email subject line..."
                            className="text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="preHeader" className="text-xs">Pre-Header</Label>
                        <Input
                            id="preHeader"
                            value={preHeader}
                            onChange={(e) => setPreHeader(e.target.value)}
                            placeholder="Preview text shown in inbox..."
                            className="text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Digest title..."
                            className="text-xs"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Personal Note */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Personal Note</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={personalNote}
                        onChange={(e) => setPersonalNote(e.target.value)}
                        placeholder="Write a personal note..."
                        rows={4}
                        className="text-xs"
                    />
                </CardContent>
            </Card>

            {/* Reviewers & Approvals */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Reviewers &amp; Approvals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(digest.approvals ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No reviewers assigned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {digest.approvals.map((approval) => {
                                const roleCfg = ROLE_BADGE[approval.role] ?? { label: approval.role, className: "" }
                                return (
                                    <div key={approval.id} className="flex items-center gap-3 py-2 px-3 rounded-md border border-muted/50 bg-muted/10">
                                        <UserCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{approval.user.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{approval.user.email}</p>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-normal shrink-0 ${roleCfg.className}`}>
                                            {roleCfg.label}
                                        </Badge>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={approval.approved}
                                                    disabled={togglingApproval === approval.id}
                                                    onChange={() => handleToggleApproval(approval)}
                                                    className="h-3.5 w-3.5"
                                                />
                                                {approval.approved ? (
                                                    <span className="text-green-600 flex items-center gap-0.5">
                                                        <CheckCircle className="h-3 w-3" weight="fill" />
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">Pending</span>
                                                )}
                                            </label>
                                            {approval.approved && approval.approvedAt && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(approval.approvedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        {digest.approvals.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-600"
                                                onClick={() => handleRemoveReviewer(approval.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {showAddReviewer ? (
                        <div className="flex items-end gap-2 pt-2 border-t border-muted/50">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs">Email</Label>
                                <Input
                                    type="email"
                                    value={newReviewerEmail}
                                    onChange={(e) => setNewReviewerEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="text-xs"
                                />
                            </div>
                            <div className="w-[140px] space-y-1.5">
                                <Label className="text-xs">Role</Label>
                                <Select value={newReviewerRole} onValueChange={setNewReviewerRole}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="author">Author</SelectItem>
                                        <SelectItem value="reviewer">Reviewer</SelectItem>
                                        <SelectItem value="proofreader">Proofreader</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleAddReviewer}
                                disabled={addingReviewer}
                                size="sm"
                                className="text-xs"
                            >
                                {addingReviewer ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                            </Button>
                            <Button
                                onClick={() => { setShowAddReviewer(false); setNewReviewerEmail(""); }}
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setShowAddReviewer(true)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            <Plus className="mr-1.5 h-3 w-3" />
                            Add Reviewer
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Section Editors */}
            {sections.map((section, index) => (
                <Card key={section.sectionType} className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-normal">Section {index + 1}</span>
                            {SECTION_DISPLAY_NAMES[section.sectionType]}
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleGenerate(index)}
                            disabled={generatingSection !== null}
                        >
                            {generatingSection === index ? (
                                <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <MagicWand className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {generatingSection === index ? "Generating..." : "Generate with AI"}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`heading-${index}`} className="text-xs">Heading</Label>
                            <Input
                                id={`heading-${index}`}
                                value={section.heading}
                                onChange={(e) => updateSection(index, "heading", e.target.value)}
                                placeholder="Section heading..."
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`body-${index}`} className="text-xs">Body</Label>
                            <Textarea
                                id={`body-${index}`}
                                value={section.body}
                                onChange={(e) => updateSection(index, "body", e.target.value)}
                                placeholder="Section content..."
                                rows={6}
                                className="text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`sourceUrl-${index}`} className="text-xs">Source URL</Label>
                                <Input
                                    id={`sourceUrl-${index}`}
                                    value={section.sourceUrl}
                                    onChange={(e) => updateSection(index, "sourceUrl", e.target.value)}
                                    placeholder="https://..."
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`sourceTitle-${index}`} className="text-xs">Source Title</Label>
                                <Input
                                    id={`sourceTitle-${index}`}
                                    value={section.sourceTitle}
                                    onChange={(e) => updateSection(index, "sourceTitle", e.target.value)}
                                    placeholder="Source name or title..."
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Bottom Save */}
            <div className="flex gap-2 pb-8">
                <Button onClick={handleSave} disabled={saving} className="text-xs">
                    {saving ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FloppyDisk className="mr-1.5 h-3.5 w-3.5" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
