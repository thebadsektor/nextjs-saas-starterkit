"use client"

import { useState, useEffect, use, Fragment } from "react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
    CircleNotch,
    ArrowLeft,
    FloppyDisk,
    Plus,
    Trash,
    Lightning,
    PencilSimple,
    BookOpen,
    CaretDown,
    CaretRight,
    CheckCircle,
    X,
    ArrowRight,
    Newspaper,
} from "@phosphor-icons/react"

type ResearchRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "PARTIAL"
type ResearchPromptType = "RESEARCH" | "WRITING"
type DigestStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED"

interface SectionTemplate {
    id: string
    name: string
    key: string
    description: string | null
    order: number
    findingCategory: string
    promptTemplate: string
    isActive: boolean
}

interface ResearchPrompt {
    id: string
    type: ResearchPromptType
    name: string
    content: string
    isActive: boolean
    version: number
}

interface ResearchFinding {
    id: string
    order: number
    category: string
    title: string
    summary: string
    sourceUrl: string
    sourceTitle: string | null
    used: boolean
}

interface ResearchRun {
    id: string
    status: ResearchRunStatus
    searchWindowDays: number
    startedAt: string | null
    completedAt: string | null
    error: string | null
    findings: ResearchFinding[]
    _count?: { findings: number; articleSets: number }
    createdAt: string
}

interface RunDigest {
    id: string
    digestNumber: number
    publishDay: string
    publishDate: string
    status: DigestStatus
}

interface KnowledgeBase {
    id: string
    name: string
    brandVoice: string
    sourceUrls: string[]
    previousTopics: string[]
}

interface Research {
    id: string
    name: string
    description: string | null
    searchWindowDays: number
    minFindings: number
    reRunOnFailure: boolean
    knowledgeBase: KnowledgeBase
    sectionTemplates: SectionTemplate[]
    prompts: ResearchPrompt[]
    runs: ResearchRun[]
}

const RUN_STATUS_BADGE: Record<ResearchRunStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" },
    RUNNING: { label: "Running", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    COMPLETED: { label: "Completed", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    FAILED: { label: "Failed", className: "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
    PARTIAL: { label: "Partial", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
}

const DIGEST_STATUS_BADGE: Record<DigestStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" },
    REVIEW: { label: "Review", className: "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    APPROVED: { label: "Approved", className: "border-purple-500/30 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
    PUBLISHED: { label: "Published", className: "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
    ARCHIVED: { label: "Archived", className: "border-yellow-500/30 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
}

export default function ResearchEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { data: session, isPending } = useSession()
    const router = useRouter()

    const [research, setResearch] = useState<Research | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [triggeringRun, setTriggeringRun] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [searchWindowDays, setSearchWindowDays] = useState("10")
    const [minFindings, setMinFindings] = useState("15")
    const [reRunOnFailure, setReRunOnFailure] = useState(true)

    // Section templates form state
    const [templates, setTemplates] = useState<SectionTemplate[]>([])
    const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

    // Prompts form state
    const [prompts, setPrompts] = useState<ResearchPrompt[]>([])
    const [editingPrompt, setEditingPrompt] = useState<string | null>(null)

    // Run history expanded state
    const [expandedRun, setExpandedRun] = useState<string | null>(null)

    // Digests created per run (keyed by run id)
    const [runDigests, setRunDigests] = useState<Record<string, RunDigest[]>>({})

    const fetchResearch = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/research/${id}`)
            if (!res.ok) throw new Error("Failed to fetch research")
            const data: Research = await res.json()

            setResearch(data)
            setName(data.name)
            setDescription(data.description ?? "")
            setSearchWindowDays(String(data.searchWindowDays))
            setMinFindings(String(data.minFindings))
            setReRunOnFailure(data.reRunOnFailure)
            setTemplates(data.sectionTemplates.sort((a, b) => a.order - b.order))
            setPrompts(data.prompts)
        } catch (error) {
            toast.error("Failed to load research config")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user.role === "admin") {
            fetchResearch()
        }
    }, [session, id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/research/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    searchWindowDays: parseInt(searchWindowDays, 10),
                    minFindings: parseInt(minFindings, 10),
                    reRunOnFailure,
                    sectionTemplates: templates.map((t) => ({
                        id: t.id,
                        name: t.name,
                        key: t.key,
                        description: t.description,
                        order: t.order,
                        findingCategory: t.findingCategory,
                        promptTemplate: t.promptTemplate,
                        isActive: t.isActive,
                    })),
                    prompts: prompts.map((p) => ({
                        id: p.id,
                        type: p.type,
                        name: p.name,
                        content: p.content,
                        isActive: p.isActive,
                        version: p.version,
                    })),
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to save research config")
            }

            toast.success("Research config saved successfully")
            await fetchResearch()
        } catch (error: any) {
            toast.error(error.message || "Failed to save research config")
        } finally {
            setSaving(false)
        }
    }

    const handleTriggerRun = async () => {
        setTriggeringRun(true)
        try {
            const res = await fetch(`/api/admin/research/${id}/runs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || "Failed to trigger run")
            }

            const data = await res.json()
            const digestCount = data.digests?.length ?? 0

            // Store digests for this run
            if (data.run?.id && data.digests) {
                setRunDigests((prev) => ({ ...prev, [data.run.id]: data.digests }))
            }

            toast.success(`Research complete — ${digestCount} digest${digestCount !== 1 ? "s" : ""} created`)
            await fetchResearch()
        } catch (error: any) {
            toast.error(error.message || "Failed to trigger research run")
        } finally {
            setTriggeringRun(false)
        }
    }

    const updateTemplate = (templateId: string, field: keyof SectionTemplate, value: string | boolean | number) => {
        setTemplates((prev) =>
            prev.map((t) => (t.id === templateId ? { ...t, [field]: value } : t))
        )
    }

    const updatePrompt = (promptId: string, field: keyof ResearchPrompt, value: string | boolean | number) => {
        setPrompts((prev) =>
            prev.map((p) => (p.id === promptId ? { ...p, [field]: value } : p))
        )
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
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }

    if (!research) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <p className="text-muted-foreground text-sm">Research config not found.</p>
                <Link href="/admin/research">
                    <Button variant="outline" className="text-xs">
                        <ArrowLeft className="mr-1.5 h-3 w-3" />
                        Back to Research
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <Link
                    href="/admin/research"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Research
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{research.name}</h1>
                <p className="text-muted-foreground text-xs">{research.description || "Research configuration"}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving} className="text-xs">
                    {saving ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FloppyDisk className="mr-1.5 h-3.5 w-3.5" />}
                    Save
                </Button>
                <Button
                    onClick={handleTriggerRun}
                    disabled={triggeringRun}
                    variant="outline"
                    className="text-xs"
                >
                    {triggeringRun ? <CircleNotch className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Lightning className="mr-1.5 h-3.5 w-3.5" />}
                    Trigger Research Run
                </Button>
            </div>

            {/* Settings */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Research config name..."
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs">Description</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                className="text-xs"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="searchWindowDays" className="text-xs">Search Window (days)</Label>
                            <Input
                                id="searchWindowDays"
                                type="number"
                                min={1}
                                value={searchWindowDays}
                                onChange={(e) => setSearchWindowDays(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minFindings" className="text-xs">Min Findings</Label>
                            <Input
                                id="minFindings"
                                type="number"
                                min={1}
                                value={minFindings}
                                onChange={(e) => setMinFindings(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Re-run on Failure</Label>
                            <Select value={reRunOnFailure ? "true" : "false"} onValueChange={(v) => setReRunOnFailure(v === "true")}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section Templates */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Section Templates</CardTitle>
                    <CardDescription className="text-xs">
                        Define the article sections that will be created from research findings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {templates.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No section templates defined.</p>
                    ) : (
                        <div className="space-y-3">
                            {templates.map((template) => (
                                <div key={template.id} className="rounded-md border border-muted/50 bg-muted/10 overflow-hidden">
                                    <div className="flex items-center gap-3 py-2 px-3">
                                        <span className="text-xs text-muted-foreground font-mono w-6 text-center">{template.order}</span>
                                        <span className="text-xs font-medium flex-1">{template.name}</span>
                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal font-mono">
                                            {template.key}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] py-0 px-1.5 font-normal cursor-pointer ${template.isActive
                                                    ? "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                                    : "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
                                                }`}
                                            onClick={() => updateTemplate(template.id, "isActive", !template.isActive)}
                                        >
                                            {template.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setEditingTemplate(editingTemplate === template.id ? null : template.id)}
                                        >
                                            <PencilSimple className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    {editingTemplate === template.id && (
                                        <div className="border-t border-muted/50 p-3 space-y-3 bg-background">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Name</Label>
                                                    <Input
                                                        value={template.name}
                                                        onChange={(e) => updateTemplate(template.id, "name", e.target.value)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Key</Label>
                                                    <Input
                                                        value={template.key}
                                                        onChange={(e) => updateTemplate(template.id, "key", e.target.value)}
                                                        className="text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Finding Category</Label>
                                                    <Input
                                                        value={template.findingCategory}
                                                        onChange={(e) => updateTemplate(template.id, "findingCategory", e.target.value)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Order</Label>
                                                    <Input
                                                        type="number"
                                                        value={template.order}
                                                        onChange={(e) => updateTemplate(template.id, "order", parseInt(e.target.value, 10) || 0)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Description</Label>
                                                <Input
                                                    value={template.description ?? ""}
                                                    onChange={(e) => updateTemplate(template.id, "description", e.target.value)}
                                                    placeholder="Optional description..."
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Prompt Template</Label>
                                                <Textarea
                                                    value={template.promptTemplate}
                                                    onChange={(e) => updateTemplate(template.id, "promptTemplate", e.target.value)}
                                                    rows={4}
                                                    className="text-xs font-mono"
                                                    placeholder="Prompt template for writing this section..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Prompts */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Prompts</CardTitle>
                    <CardDescription className="text-xs">
                        1A (RESEARCH) prompts for finding content, 1B (WRITING) prompts for generating articles.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {prompts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No prompts defined.</p>
                    ) : (
                        <div className="space-y-3">
                            {prompts.map((prompt) => (
                                <div key={prompt.id} className="rounded-md border border-muted/50 bg-muted/10 overflow-hidden">
                                    <div className="flex items-center gap-3 py-2 px-3">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] py-0 px-1.5 font-normal shrink-0 ${prompt.type === "RESEARCH"
                                                    ? "border-purple-500/30 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                                                    : "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                                }`}
                                        >
                                            {prompt.type === "RESEARCH" ? "1A Research" : "1B Writing"}
                                        </Badge>
                                        <span className="text-xs font-medium flex-1">{prompt.name}</span>
                                        <span className="text-[10px] text-muted-foreground">v{prompt.version}</span>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] py-0 px-1.5 font-normal cursor-pointer ${prompt.isActive
                                                    ? "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                                    : "border-gray-400/30 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
                                                }`}
                                            onClick={() => updatePrompt(prompt.id, "isActive", !prompt.isActive)}
                                        >
                                            {prompt.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setEditingPrompt(editingPrompt === prompt.id ? null : prompt.id)}
                                        >
                                            <PencilSimple className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    {editingPrompt === prompt.id && (
                                        <div className="border-t border-muted/50 p-3 space-y-3 bg-background">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Name</Label>
                                                    <Input
                                                        value={prompt.name}
                                                        onChange={(e) => updatePrompt(prompt.id, "name", e.target.value)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Version</Label>
                                                    <Input
                                                        type="number"
                                                        value={prompt.version}
                                                        onChange={(e) => updatePrompt(prompt.id, "version", parseInt(e.target.value, 10) || 1)}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Content</Label>
                                                <Textarea
                                                    value={prompt.content}
                                                    onChange={(e) => updatePrompt(prompt.id, "content", e.target.value)}
                                                    rows={10}
                                                    className="text-xs font-mono"
                                                    placeholder="Prompt content..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Knowledge Base */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Base
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Name</Label>
                        <p className="text-xs font-medium">{research.knowledgeBase.name}</p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Brand Voice</Label>
                        <div className="rounded-md border border-muted/50 p-3 bg-muted/10">
                            <p className="text-xs whitespace-pre-wrap">{research.knowledgeBase.brandVoice || "Not set"}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Source URLs ({research.knowledgeBase.sourceUrls.length})</Label>
                        {research.knowledgeBase.sourceUrls.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No source URLs configured.</p>
                        ) : (
                            <div className="space-y-1">
                                {research.knowledgeBase.sourceUrls.map((url, i) => (
                                    <p key={i} className="text-xs text-blue-600 truncate">{url}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Previous Topics ({research.knowledgeBase.previousTopics.length})</Label>
                        {research.knowledgeBase.previousTopics.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No previous topics tracked.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {research.knowledgeBase.previousTopics.map((topic, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                        {topic}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Run History */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Run History</CardTitle>
                </CardHeader>
                <CardContent>
                    {(!research.runs || research.runs.length === 0) ? (
                        <p className="text-xs text-muted-foreground">No runs yet. Trigger a research run to get started.</p>
                    ) : (
                        <div className="space-y-0">
                            <div className="rounded-md border border-muted/50 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/30 text-xs">
                                        <TableRow>
                                            <TableHead className="w-[30px]"></TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Findings</TableHead>
                                            <TableHead>Digests</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-xs">
                                        {research.runs.map((run) => {
                                            const statusCfg = RUN_STATUS_BADGE[run.status]
                                            const isExpanded = expandedRun === run.id
                                            const findingsCount = run._count?.findings ?? run.findings?.length ?? 0
                                            const articleSetsCount = run._count?.articleSets ?? 0

                                            return (
                                                <Fragment key={run.id}>
                                                    <TableRow
                                                        className="cursor-pointer hover:bg-muted/20"
                                                        onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                                                    >
                                                        <TableCell>
                                                            {isExpanded
                                                                ? <CaretDown className="h-3 w-3 text-muted-foreground" />
                                                                : <CaretRight className="h-3 w-3 text-muted-foreground" />
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-normal ${statusCfg.className}`}>
                                                                {statusCfg.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {run.startedAt ? new Date(run.startedAt).toLocaleString() : run.createdAt ? new Date(run.createdAt).toLocaleString() : "--"}
                                                        </TableCell>
                                                        <TableCell>{findingsCount}</TableCell>
                                                        <TableCell>{articleSetsCount}</TableCell>
                                                        <TableCell className="text-right">
                                                            {run.status === "COMPLETED" && (
                                                                <Link
                                                                    href="/admin/digests"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                                                                >
                                                                    View Digests
                                                                    <ArrowRight className="h-2.5 w-2.5" />
                                                                </Link>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Expanded content */}
                                                    {isExpanded && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="p-0">
                                                                <div className="border-t border-muted/50 p-3 bg-muted/5">
                                                                    {/* Error */}
                                                                    {run.error && (
                                                                        <div className="mb-3 rounded-md border border-red-200/50 p-2 bg-red-50/50 dark:bg-red-500/5">
                                                                            <p className="text-xs text-red-700 dark:text-red-400">{run.error}</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Findings */}
                                                                    {run.findings && run.findings.length > 0 ? (
                                                                        <div>
                                                                            <p className="text-xs font-medium mb-2">Findings ({run.findings.length})</p>
                                                                            <div className="space-y-2">
                                                                                {run.findings.map((finding) => (
                                                                                    <div key={finding.id} className="rounded-md border border-muted/50 p-2 bg-background">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <span className="text-[10px] text-muted-foreground">#{finding.order}</span>
                                                                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                                                                                {finding.category}
                                                                                            </Badge>
                                                                                            <span className="text-xs font-medium flex-1 truncate">{finding.title}</span>
                                                                                            {finding.used && (
                                                                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal border-green-500/30 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                                                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                                                                                                    Used
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-xs text-muted-foreground line-clamp-2">{finding.summary}</p>
                                                                                        {finding.sourceUrl && (
                                                                                            <p className="text-[10px] text-blue-600 mt-1 truncate">
                                                                                                {finding.sourceTitle || finding.sourceUrl}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-muted-foreground">No findings for this run.</p>
                                                                    )}

                                                                    {/* Digests created from this run */}
                                                                    {runDigests[run.id] && runDigests[run.id].length > 0 && (
                                                                        <div className="mt-3 pt-3 border-t border-muted/50">
                                                                            <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                                                                                <Newspaper className="h-3 w-3" />
                                                                                Digests created from this run:
                                                                            </p>
                                                                            <div className="space-y-1.5">
                                                                                {runDigests[run.id].map((digest) => {
                                                                                    const digestStatusCfg = DIGEST_STATUS_BADGE[digest.status] ?? DIGEST_STATUS_BADGE.DRAFT
                                                                                    return (
                                                                                        <div key={digest.id} className="flex items-center gap-2 rounded-md border border-muted/50 p-2 bg-background">
                                                                                            <span className="text-xs font-medium">#{digest.digestNumber}</span>
                                                                                            <span className="text-xs text-muted-foreground">{digest.publishDay}</span>
                                                                                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-normal ${digestStatusCfg.className}`}>
                                                                                                {digestStatusCfg.label}
                                                                                            </Badge>
                                                                                            <span className="flex-1" />
                                                                                            <Link
                                                                                                href={`/admin/digests/${digest.id}`}
                                                                                                className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                                                                                            >
                                                                                                View
                                                                                                <ArrowRight className="h-2.5 w-2.5" />
                                                                                            </Link>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
