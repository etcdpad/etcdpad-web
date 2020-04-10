export type ITreeNode<T> = ITreeDir<T> | ITreeFile<T>

export enum TreeNodeType {
    Directory = 'dir',
    File = 'file',
    FileDirectory = 'filedir',
}

export interface IBaseTreeNode {
    // id: string
    type: TreeNodeType
    name: string
    fullPath: string
}

export interface ITreeFile<T> extends IBaseTreeNode {
    type: TreeNodeType.File | TreeNodeType.FileDirectory
    stat: T
    // size: number
    // value: string
}
export interface ITreeDir<T> extends IBaseTreeNode {
    type: TreeNodeType.Directory | TreeNodeType.FileDirectory
    children: ITreeNode<T>[]
}

export function isDir<T>(node: ITreeNode<T>): node is ITreeDir<T> {
    return node.type !== TreeNodeType.File
}
export function isEmpty<T>(node: ITreeDir<T>): boolean {
    return node.children.length === 0
}

export function isFile<T>(node: ITreeNode<T>): node is ITreeFile<T> {
    return node.type !== TreeNodeType.Directory
}
