import { useState, useCallback } from "react";
import {
    ChevronRight,
    ChevronDown,
    FileIcon,
    FolderIcon,
    FolderOpenIcon,
    FileJson,
    FileText,
    FileType,
    Image,
    FileCode,
    Database,
    Lock,
    Package,
    Braces,
    Hash,
    Palette,
    Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TreeItem } from "@/types";

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

interface TreeViewProps {
    data: TreeItem[];
    value: string | null;
    onSelect?: (path: string) => void;
}

interface TreeNodeProps {
    item: TreeItem;
    path: string;
    selectedPath: string | null;
    onSelect?: (path: string) => void;
    level: number;
    isLast: boolean;
    parentLines: boolean[];
}

// Get file icon based on extension (VS Code style)
const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const name = filename.toLowerCase();

    // Special files
    if (name === 'package.json') return <Package className="w-4 h-4 text-green-500" />;
    if (name === 'package-lock.json') return <Lock className="w-4 h-4 text-yellow-600" />;
    if (name === 'tsconfig.json') return <TypeScriptIcon className="w-4 h-4 text-blue-500" />;
    if (name === '.gitignore') return <FileText className="w-4 h-4 text-gray-500" />;
    if (name === '.env' || name.startsWith('.env.')) return <Lock className="w-4 h-4 text-yellow-500" />;
    if (name === 'dockerfile') return <Database className="w-4 h-4 text-blue-400" />;
    if (name === 'readme.md') return <FileText className="w-4 h-4 text-blue-400" />;

    // By extension
    switch (ext) {
        // TypeScript/JavaScript
        case 'ts':
            return <TypeScriptIcon className="w-4 h-4 text-blue-500" />;
        case 'tsx':
            return <ReactIcon className="w-4 h-4 text-cyan-400" />;
        case 'js':
            return <FileCode className="w-4 h-4 text-yellow-400" />;
        case 'jsx':
            return <ReactIcon className="w-4 h-4 text-cyan-400" />;

        // Web
        case 'html':
            return <Globe className="w-4 h-4 text-orange-500" />;
        case 'css':
            return <Palette className="w-4 h-4 text-blue-500" />;
        case 'scss':
        case 'sass':
            return <Palette className="w-4 h-4 text-pink-400" />;

        // Data/Config
        case 'json':
            return <Braces className="w-4 h-4 text-yellow-500" />;
        case 'yaml':
        case 'yml':
            return <FileJson className="w-4 h-4 text-red-400" />;
        case 'xml':
            return <FileCode className="w-4 h-4 text-orange-400" />;
        case 'env':
            return <Lock className="w-4 h-4 text-yellow-500" />;

        // Markdown/Text
        case 'md':
        case 'mdx':
            return <FileText className="w-4 h-4 text-blue-300" />;
        case 'txt':
            return <FileText className="w-4 h-4 text-gray-400" />;

        // Images
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
        case 'ico':
            return <Image className="w-4 h-4 text-purple-400" />;

        // Python
        case 'py':
            return <Hash className="w-4 h-4 text-yellow-500" />;

        // Other code
        case 'sql':
            return <Database className="w-4 h-4 text-blue-400" />;
        case 'prisma':
            return <Database className="w-4 h-4 text-teal-500" />;
        case 'graphql':
        case 'gql':
            return <Braces className="w-4 h-4 text-pink-500" />;

        // Fonts
        case 'woff':
        case 'woff2':
        case 'ttf':
        case 'otf':
            return <FileType className="w-4 h-4 text-red-400" />;

        default:
            return <FileIcon className="w-4 h-4 text-muted-foreground" />;
    }
};

// Get folder icon with colors
const getFolderIcon = (folderName: string, isOpen: boolean) => {
    const name = folderName.toLowerCase();

    // Special folder colors
    let colorClass = "text-sky-500";

    if (name === 'components' || name === 'ui') colorClass = "text-purple-500";
    else if (name === 'app' || name === 'pages') colorClass = "text-green-500";
    else if (name === 'lib' || name === 'utils') colorClass = "text-yellow-500";
    else if (name === 'hooks') colorClass = "text-pink-500";
    else if (name === 'api') colorClass = "text-blue-500";
    else if (name === 'styles') colorClass = "text-teal-500";
    else if (name === 'public' || name === 'assets') colorClass = "text-orange-500";
    else if (name === 'node_modules') colorClass = "text-gray-500";
    else if (name === 'prisma') colorClass = "text-teal-500";
    else if (name === 'types') colorClass = "text-blue-400";

    if (isOpen) {
        return <FolderOpenIcon className={cn("w-4 h-4", colorClass)} />;
    }
    return <FolderIcon className={cn("w-4 h-4", colorClass)} />;
};

const TreeNode = ({
    item,
    path,
    selectedPath,
    onSelect,
    level,
    isLast,
    parentLines,
}: TreeNodeProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const isFolder = Array.isArray(item);
    const name = isFolder ? item[0] : item;
    const children = isFolder ? item.slice(1) as TreeItem[] : [];
    const currentPath = path ? `${path}/${name}` : name;
    const isSelected = selectedPath === currentPath;

    const handleClick = useCallback(() => {
        if (isFolder) {
            setIsExpanded(prev => !prev);
        } else {
            onSelect?.(currentPath);
        }
    }, [isFolder, currentPath, onSelect]);

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={cn(
                    "flex items-center w-full py-0.5 text-sm hover:bg-accent/50 transition-colors text-left relative group/item",
                    isSelected && "bg-accent text-accent-foreground"
                )}
            >
                {/* Indentation and connection lines */}
                <div className="flex items-center h-6">
                    {/* Parent vertical lines */}
                    {parentLines.map((showLine, idx) => (
                        <div
                            key={idx}
                            className="w-4 h-full relative flex items-center justify-center"
                        >
                            {showLine && (
                                <div className="absolute w-px h-full bg-border/40" />
                            )}
                        </div>
                    ))}

                    {/* Current level L-shaped connector */}
                    {level > 0 && (
                        <div className="relative w-4 h-full flex items-center justify-center">
                            {/* Vertical line */}
                            <div
                                className={cn(
                                    "absolute left-2 w-px bg-border/40",
                                    isLast ? "top-0 h-3" : "top-0 h-full"
                                )}
                            />
                            {/* Horizontal line */}
                            <div className="absolute top-3 left-2 w-2 h-px bg-border/40" />
                        </div>
                    )}
                </div>

                {/* Chevron */}
                <span className="w-4 h-4 flex items-center justify-center shrink-0 ml-0.5">
                    {isFolder ? (
                        isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )
                    ) : (
                        <span className="w-3 h-3" />
                    )}
                </span>

                {/* Icon */}
                <span className="w-4 h-4 flex items-center justify-center shrink-0 mr-1.5 ml-1">
                    {isFolder
                        ? getFolderIcon(name, isExpanded)
                        : getFileIcon(name)
                    }
                </span>

                {/* Name - bold for files */}
                <span className={cn(
                    "truncate pr-2",
                    !isFolder && "font-semibold"
                )}>
                    {name}
                </span>
            </button>

            {/* Children */}
            {isFolder && isExpanded && children.length > 0 && (
                <div className="relative">
                    {children.map((child, index) => {
                        const childName = Array.isArray(child) ? child[0] : child;
                        const isLastChild = index === children.length - 1;
                        return (
                            <TreeNode
                                key={`${currentPath}/${childName}-${index}`}
                                item={child}
                                path={currentPath}
                                selectedPath={selectedPath}
                                onSelect={onSelect}
                                level={level + 1}
                                isLast={isLastChild}
                                parentLines={[...parentLines, !isLast]}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const TreeView = ({
    data,
    value,
    onSelect,
}: TreeViewProps) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No files to display
            </div>
        );
    }

    return (
        <div className="py-2 overflow-auto h-full text-sm">
            {data.map((item, index) => {
                const name = Array.isArray(item) ? item[0] : item;
                const isLastItem = index === data.length - 1;
                return (
                    <TreeNode
                        key={`${name}-${index}`}
                        item={item}
                        path=""
                        selectedPath={value}
                        onSelect={onSelect}
                        level={0}
                        isLast={isLastItem}
                        parentLines={[]}
                    />
                );
            })}
        </div>
    );
};
