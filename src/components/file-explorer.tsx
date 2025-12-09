import {
    CopyIcon,
    CopyCheckIcon,
    ChevronRight,
    FileIcon,
    FolderIcon,
    FileCode,
    FileText,
    FileType,
    Image,
    Database,
    Lock,
    Package,
    Braces,
    Hash,
    Palette,
    Globe,
    DownloadIcon,
} from "lucide-react";
import JSZip from "jszip";
import { useState, useMemo, useCallback, Fragment, ReactNode } from "react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code-view";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";

type FileCollection = { [path: string]: string };

// React logo SVG component
const ReactIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 01-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9s-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03s1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26s-1.18-1.63-3.28-2.26c-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26s1.18 1.63 3.28 2.26c.25-.76.55-1.51.89-2.26m9 2.26l-.3.51c.31-.05.61-.1.88-.16-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7.64-.35.83-1.82.32-3.96-.77.16-1.58.28-2.4.36-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 012.4-.36c.48-.67.99-1.31 1.51-1.9z"/>
    </svg>
);

// TypeScript logo SVG component
const TypeScriptIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M3 3h18v18H3V3zm10.71 14.86c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8zM10 17V12H8v-1.5h6V12h-2v5H10z"/>
    </svg>
);

// Get file icon based on extension
const getFileIcon = (filename: string, size: string = "w-4 h-4"): ReactNode => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const name = filename.toLowerCase();

    // Special files
    if (name === 'package.json') return <Package className={`${size} text-green-500`} />;
    if (name === 'package-lock.json') return <Lock className={`${size} text-yellow-600`} />;
    if (name === 'tsconfig.json') return <TypeScriptIcon className={`${size} text-blue-500`} />;
    if (name === '.gitignore') return <FileText className={`${size} text-gray-500`} />;
    if (name === '.env' || name.startsWith('.env.')) return <Lock className={`${size} text-yellow-500`} />;
    if (name === 'dockerfile') return <Database className={`${size} text-blue-400`} />;
    if (name === 'readme.md') return <FileText className={`${size} text-blue-400`} />;

    switch (ext) {
        case 'ts':
            return <TypeScriptIcon className={`${size} text-blue-500`} />;
        case 'tsx':
            return <ReactIcon className={`${size} text-cyan-400`} />;
        case 'js':
            return <FileCode className={`${size} text-yellow-400`} />;
        case 'jsx':
            return <ReactIcon className={`${size} text-cyan-400`} />;
        case 'html':
            return <Globe className={`${size} text-orange-500`} />;
        case 'css':
            return <Palette className={`${size} text-blue-500`} />;
        case 'scss':
        case 'sass':
            return <Palette className={`${size} text-pink-400`} />;
        case 'json':
            return <Braces className={`${size} text-yellow-500`} />;
        case 'md':
        case 'mdx':
            return <FileText className={`${size} text-blue-300`} />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
        case 'ico':
            return <Image className={`${size} text-purple-400`} />;
        case 'py':
            return <Hash className={`${size} text-yellow-500`} />;
        case 'sql':
            return <Database className={`${size} text-blue-400`} />;
        case 'prisma':
            return <Database className={`${size} text-teal-500`} />;
        case 'woff':
        case 'woff2':
        case 'ttf':
        case 'otf':
            return <FileType className={`${size} text-red-400`} />;
        default:
            return <FileIcon className={`${size} text-muted-foreground`} />;
    }
};

function getLanguageFromExtension(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension || "text";
}

interface FileBreadcrumbProps {
    filePath: string;
    onNavigate?: (path: string) => void;
}

const FileBreadcrumb = ({ filePath, onNavigate }: FileBreadcrumbProps) => {
    const parts = filePath.split("/");

    return (
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
            {parts.map((part, index) => {
                const isLast = index === parts.length - 1;
                const currentPath = parts.slice(0, index + 1).join("/");

                return (
                    <Fragment key={currentPath}>
                        <button
                            onClick={() => onNavigate?.(currentPath)}
                            className={`
                                flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-accent/50 transition-colors shrink-0
                                ${isLast ? "text-foreground font-medium" : "text-muted-foreground"}
                            `}
                        >
                            {isLast ? (
                                getFileIcon(part, "w-3.5 h-3.5")
                            ) : (
                                <FolderIcon className="w-3.5 h-3.5 text-sky-500" />
                            )}
                            <span className="truncate max-w-[150px]">{part}</span>
                        </button>
                        {!isLast && (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
};

interface FileExplorerProps {
    files: FileCollection;
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
    const [selectedFile, setSelectedFile] = useState<string | null>(() => {
        const fileKeys = Object.keys(files);
        return fileKeys.length > 0 ? fileKeys[0] : null;
    });
    const [copied, setCopied] = useState(false);

    const treeData = useMemo(() => {
        return convertFilesToTreeItems(files);
    }, [files]);

    const handleFileSelect = useCallback(
        (filePath: string) => {
            if (files[filePath]) {
                setSelectedFile(filePath);
            }
        },
        [files]
    );

    const handleCopy = useCallback(async () => {
        if (selectedFile && files[selectedFile]) {
            await navigator.clipboard.writeText(files[selectedFile]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [selectedFile, files]);

    const handleDownloadAll = useCallback(async () => {
        const zip = new JSZip();

        // Add all files to the zip
        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });

        // Generate the zip file
        const blob = await zip.generateAsync({ type: "blob" });

        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "project-files.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [files]);

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} className="bg-sidebar">
                <TreeView
                    data={treeData}
                    value={selectedFile}
                    onSelect={handleFileSelect}
                />
            </ResizablePanel>
            <ResizableHandle className="hover:bg-primary transition-colors" />
            <ResizablePanel defaultSize={70} minSize={40}>
                {selectedFile && files[selectedFile] ? (
                    <div className="h-full w-full flex flex-col">
                        <div className="border-b bg-sidebar px-3 py-2 flex justify-between items-center gap-x-2">
                            <FileBreadcrumb
                                filePath={selectedFile}
                                onNavigate={handleFileSelect}
                            />
                            <div className="flex items-center gap-1">
                                <Hint text="Download all files" side="bottom">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={handleDownloadAll}
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                    </Button>
                                </Hint>
                                <Hint text={copied ? "Copied!" : "Copy to clipboard"} side="bottom">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <CopyCheckIcon className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <CopyIcon className="w-4 h-4" />
                                        )}
                                    </Button>
                                </Hint>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <CodeView
                                code={files[selectedFile]}
                                lang={getLanguageFromExtension(selectedFile)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a file to view its content
                    </div>
                )}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};
