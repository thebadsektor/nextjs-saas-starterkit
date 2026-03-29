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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
    Lightning,
    BookOpen,
} from "@phosphor-icons/react"

type DigestStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "FAILED"
type ArticleStatus = "EMPTY" | "GENERATED" | "EDITED" | "APPROVED"

interface Article {
    id: string
    order: number
    heading: string
    body: string
    sourceUrl: string
    sourceTitle: string
    status: ArticleStatus
    sectionTemplate: { id: string; name: string; key: string } | null
    finding: { id: string; title: string; summary: string } | null
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
    articleSet: {
        id: string
        status: string
        articles: Article[]
    } | null
}

const STATUS_BADGE: Record<DigestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    IN_REVIEW: { label: "In Review", variant: "outline", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
    APPROVED: { label: "Approved", variant: "outline", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    PUBLISHED: { label: "Published", variant: "outline", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    FAILED: { label: "Failed", variant: "destructive" },
}

const ARTICLE_STATUS_BADGE: Record<ArticleStatus, { label: string; className: string }> = {
    EMPTY: { label: "Empty", className: "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" },
    GENERATED: { label: "Generated", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    EDITED: { label: "Edited", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
    APPROVED: { label: "Approved", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
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
    const [generatingArticle, setGeneratingArticle] = useState<string | null>(null)
    const [generatingAll, setGeneratingAll] = useState(false)

    // Form state
    const [subjectLine, setSubjectLine] = useState("")
    const [preHeader, setPreHeader] = useState("")
    const [title, setTitle] = useState("")
    const [personalNote, setPersonalNote] = useState("")
    const [articles, setArticles] = useState<Article[]>([])

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

            // Load articles from articleSet
            const loadedArticles = (data.articleSet?.articles ?? [])
                .sort((a, b) => a.order - b.order)
                .map((a) => ({
                    ...a,
                    heading: a.heading ?? "",
                    body: a.body ?? "",
                    sourceUrl: a.sourceUrl ?? "",
                    sourceTitle: a.sourceTitle ?? "",
                }))
            setArticles(loadedArticles)
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
                    articles: articles.map((a) => ({
                        id: a.id,
                        heading: a.heading,
                        body: a.body,
                        sourceUrl: a.sourceUrl,
                        sourceTitle: a.sourceTitle,
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

    const updateArticle = (articleId: string, field: keyof Article, value: string) => {
        setArticles((prev) =>
            prev.map((a) => (a.id === articleId ? { ...a, [field]: value } : a))
        )
    }

    const handleGenerate = async (articleId: string) => {
        const article = articles.find((a) => a.id === articleId)
        if (!article) return

        setGeneratingArticle(articleId)
        try {
            const res = await fetch(`/api/admin/digests/${id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    articleId: article.id,
                    topic: article.heading || undefined,
                }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to generate")
            }
            const { heading, body } = await res.json()
            setArticles((prev) =>
                prev.map((a) =>
                    a.id === articleId
                        ? { ...a, heading, body, status: "GENERATED" as ArticleStatus }
                        : a
                )
            )
            const templateName = article.sectionTemplate?.name ?? `Article ${article.order}`
            toast.success(`Generated ${templateName} content`)
        } catch (error: any) {
            toast.error(error.message || "Failed to generate content")
        } finally {
            setGeneratingArticle(null)
        }
    }

    const handleGenerateAll = async () => {
        setGeneratingAll(true)
        try {
            const res = await fetch(`/api/admin/digests/${id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ generateAll: true }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to generate all")
            }
            toast.success("All articles generated successfully")
            await fetchDigest()
        } catch (error: any) {
            toast.error(error.message || "Failed to generate all content")
        } finally {
            setGeneratingAll(false)
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
                <Breadcrumb className="mb-4">
                    <BreadcrumbList className="text-xs">
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/digests">Digests</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{digest.title || `Digest #${digest.digestNumber} — ${DAY_LABELS[digest.publishDay] ?? digest.publishDay}`}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Digest #{digest.digestNumber} &mdash; {DAY_LABELS[digest.publishDay] ?? digest.publishDay}
                    </h1>
                    <Badge variant={statusConfig.variant} className={`text-[10px] py-0 px-1.5 font-normal ${statusConfig.className ?? ""}`}>
                        {statusConfig.label}
                    </Badge>
                    {digest.articleSet && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            Articles: {digest.articleSet.status}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} className="text-xs">
                    {saving ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FloppyDisk className="mr-1.5 h-3.5 w-3.5" />}
                    Save
                </Button>

                <Button
                    onClick={handleGenerateAll}
                    disabled={generatingAll || generatingArticle !== null}
                    variant="outline"
                    className="text-xs"
                >
                    {generatingAll ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Lightning className="mr-1.5 h-3.5 w-3.5" />}
                    {generatingAll ? "Generating All..." : "Generate All"}
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
                                Are you sure you want to delete Digest #{digest.digestNumber}? This action cannot be undone and will permanently remove the digest and all its articles.
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
                        {articles.map((article) => (
                            <div key={article.id} className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    {article.sectionTemplate?.name ?? `Article ${article.order}`}
                                </p>
                                {article.heading && <p className="text-sm font-semibold">{article.heading}</p>}
                                {article.body && (
                                <div className="text-sm prose prose-sm max-w-none dark:prose-invert"
                                     dangerouslySetInnerHTML={{ __html: article.body }} />
                            )}
                                {article.sourceUrl && (
                                    <p className="text-xs text-blue-600">
                                        Source: {article.sourceTitle || article.sourceUrl}
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

            {/* Article Editors */}
            {articles.length === 0 && (
                <Card className="border-none shadow-sm">
                    <CardContent className="py-10 text-center">
                        <p className="text-sm text-muted-foreground">No articles yet. This digest has no article set.</p>
                    </CardContent>
                </Card>
            )}

            {articles.map((article) => {
                const articleTitle = article.sectionTemplate?.name ?? `Article ${article.order}`
                const statusCfg = ARTICLE_STATUS_BADGE[article.status]

                return (
                    <Card key={article.id} className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-normal">#{article.order}</span>
                                {articleTitle}
                                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-normal ${statusCfg.className}`}>
                                    {statusCfg.label}
                                </Badge>
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleGenerate(article.id)}
                                disabled={generatingArticle !== null || generatingAll}
                            >
                                {generatingArticle === article.id ? (
                                    <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <MagicWand className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {generatingArticle === article.id ? "Generating..." : "Generate with AI"}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`heading-${article.id}`} className="text-xs">Heading</Label>
                                <Input
                                    id={`heading-${article.id}`}
                                    value={article.heading}
                                    onChange={(e) => updateArticle(article.id, "heading", e.target.value)}
                                    placeholder="Article heading..."
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`body-${article.id}`} className="text-xs">Body</Label>
                                <Textarea
                                    id={`body-${article.id}`}
                                    value={article.body}
                                    onChange={(e) => updateArticle(article.id, "body", e.target.value)}
                                    placeholder="Article content..."
                                    rows={6}
                                    className="text-xs"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`sourceUrl-${article.id}`} className="text-xs">Source URL</Label>
                                    <Input
                                        id={`sourceUrl-${article.id}`}
                                        value={article.sourceUrl}
                                        onChange={(e) => updateArticle(article.id, "sourceUrl", e.target.value)}
                                        placeholder="https://..."
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`sourceTitle-${article.id}`} className="text-xs">Source Title</Label>
                                    <Input
                                        id={`sourceTitle-${article.id}`}
                                        value={article.sourceTitle}
                                        onChange={(e) => updateArticle(article.id, "sourceTitle", e.target.value)}
                                        placeholder="Source name or title..."
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            {/* Research source note */}
                            {article.finding && (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20">
                                    <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                    <div className="text-xs text-blue-700 dark:text-blue-400">
                                        <span className="font-medium">Research source:</span>{" "}
                                        {article.finding.title}
                                        {article.finding.summary && (
                                            <span className="text-blue-600/70 dark:text-blue-400/70"> — {article.finding.summary.slice(0, 100)}{article.finding.summary.length > 100 ? "..." : ""}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}

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
