import {
    DragOverlay,
} from '@dnd-kit/core';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Edit, GripVertical, MoreVertical, Plus, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { T_Role } from '#shared/graphql';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '#shared/component';
import { Button } from '#shared/component/button';
import { useTranslate } from '#shared/i18n';

import type { I_RoleTreeProps, I_TreeNode } from './role.type';

function buildTree(roles: T_Role[], parentId: string | null = null): I_TreeNode[] {
    return roles
        .filter(r => (r.parentId || null) === parentId)
        .map(r => ({ ...r, children: buildTree(roles, r.id!) }));
}

function flattenTree(nodes: I_TreeNode[], depth = 0, parentIdFlat: string | null = null): Array<I_TreeNode & { depth: number; parentIdFlat: string | null }> {
    return nodes.flatMap(node => [
        { ...node, depth, parentIdFlat },
        ...(node.expanded !== false && node.children ? flattenTree(node.children, depth + 1, node.id!) : []),
    ]);
}

function SortableRoleItem({ node, depth, onToggle, onEdit, onDelete, selectedRoleId, onSelectRole, onAddUser, onCreateSubRole }: {
    node: I_TreeNode & { depth: number };
    depth: number;
    onToggle: (id: string) => void;
    onEdit: (role: T_Role) => void;
    onDelete: (role: T_Role) => void;
    selectedRoleId?: string | null;
    onSelectRole?: (roleId: string | null) => void;
    onAddUser?: (role: T_Role) => void;
    onCreateSubRole?: (role: T_Role) => void;
}) {
    const { t } = useTranslate('authz');
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: node.id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginLeft: depth * 24,
        background: isDragging ? '#f3f4f6' : selectedRoleId === node.id ? '#e0e7ff' : undefined,
        cursor: 'pointer',
    };
    const hasChildren = node.children && node.children.length > 0;
    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 py-1 rounded select-none dark:bg-slate-800 ${selectedRoleId === node.id ? 'ring-2 ring-primary bg-blue-50 dark:bg-blue-900/50 dark:ring-blue-400' : ''}`}
            onClick={(e) => {
                if (onSelectRole && !(e.target as HTMLElement).closest('.drag-handle, .role-action')) {
                    if (selectedRoleId === node.id) {
                        onSelectRole(null);
                    }
                    else {
                        onSelectRole(node.id!);
                    }
                }
            }}
        >
            <span
                {...listeners}
                {...attributes}
                onClick={e => e.stopPropagation()}
                className="drag-handle cursor-grab px-1 text-muted-foreground dark:text-slate-400"
            >
                <GripVertical className="w-4 h-4" />
            </span>
            {node.children.length > 0 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(node.id!);
                    }}
                    className="focus:outline-none dark:text-slate-300"
                >
                    {node.expanded !== false ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            )}
            <span className="font-medium flex-1 truncate dark:text-slate-200">{node.name}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="role-action p-1 rounded hover:bg-accent dark:hover:bg-slate-700 focus:outline-none dark:text-slate-300" type="button">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 min-w-[180px] rounded-md border bg-popover dark:bg-slate-800 dark:border-slate-700 p-1 shadow-md">
                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent dark:hover:bg-slate-700 dark:text-slate-200"
                        onSelect={(e: Event) => {
                            e.preventDefault();
                            onCreateSubRole?.(node);
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('create-sub-role')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent dark:hover:bg-slate-700 dark:text-slate-200"
                        onSelect={(e: Event) => {
                            e.preventDefault();
                            onEdit(node);
                        }}
                    >
                        <Edit className="w-4 h-4" />
                        <span>{t('update-role')}</span>
                    </DropdownMenuItem>
                    {!hasChildren && (
                        <DropdownMenuItem
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent dark:hover:bg-slate-700 text-destructive dark:text-red-400"
                            onSelect={(e: Event) => {
                                e.preventDefault();
                                onDelete(node);
                            }}
                            variant="destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('delete-role')}</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent dark:hover:bg-slate-700 dark:text-slate-200"
                        onSelect={(e: Event) => {
                            e.preventDefault();
                            onAddUser?.(node);
                        }}
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>{t('add-user')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}

export function RoleTree({ roles, onEdit, onDelete, onCreateNew, loading, selectedRoleId, onSelectRole, onAddUser, onCreateSubRole }: I_RoleTreeProps & { onAddUser?: (role: T_Role) => void; onCreateSubRole?: (role: T_Role) => void }) {
    const { t } = useTranslate('authz');
    const [tree, setTree] = useState<I_TreeNode[]>(() => buildTree(roles));
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId] = useState<string | null>(null);

    useMemo(() => {
        setTree(buildTree(roles));
    }, [roles]);

    const _handleToggle = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
        setTree(prevTree =>
            prevTree.map(node =>
                node.id === id ? { ...node, expanded: !node.expanded } : node,
            ),
        );
    };

    const flatTree = flattenTree(tree).map(node => ({ ...node, expanded: expanded[node.id!] !== false }));

    function _findNodeById(nodes: I_TreeNode[], id: string): I_TreeNode | null {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            const found = _findNodeById(node.children, id);

            if (found) {
                return found;
            }
        }
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">{t('filter-by-role')}</span>
                <Button onClick={onCreateNew} className="flex items-center space-x-2">
                    <span>{t('create-role')}</span>
                </Button>
            </div>
            <ul className="space-y-1">
                {flatTree.map(node => (
                    <SortableRoleItem
                        key={node.id}
                        node={node}
                        depth={node.depth}
                        onToggle={_handleToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        selectedRoleId={selectedRoleId}
                        onSelectRole={onSelectRole}
                        onAddUser={onAddUser}
                        onCreateSubRole={onCreateSubRole}
                    />
                ))}
            </ul>
            {loading && <div className="text-center py-8 dark:text-slate-300">{t('loading')}</div>}
            <DragOverlay>
                {activeId && (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded shadow p-2 dark:text-slate-200">
                        {_findNodeById(tree, activeId)?.name}
                    </div>
                )}
            </DragOverlay>
        </div>
    );
}
