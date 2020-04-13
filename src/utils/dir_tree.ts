import { ITreeFile, TreeNodeType, ITreeDir, ITreeNode, isFile, isDir } from '@/components/tree'
import { decode } from './base64'

function nodeEq<T>(node: DirTreeNode<T>, name: string): boolean {
    return node.name === name || (node.name === '/' && name === '')
}

export abstract class BaseDirTreeNodeDir<T> {
    protected root = false
    public abstract type: TreeNodeType
    public fullPath: string
    public name: string
    public readonly children: DirTreeNode<T>[] = []
    public constructor(name: string, fullPath: string) {
        this.name = name || '/'
        this.fullPath = fullPath
    }
    public append(paths: string[], stat: T) {
        if (paths.length === 0) return
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const name = paths.shift()!
        const nextFullpath = this.root ? name : (this.fullPath + '/' + name)
        if (paths.length === 0) {
            const index = this.children.findIndex(x => nodeEq(x, name))
            let subdir: DirTreeNode<T>
            if (index === -1) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                subdir = new DirTreeNodeFile(name, nextFullpath, stat)
                this.children.push(subdir)
            } else {
                subdir = this.children[index]
                if (subdir.type !== TreeNodeType.Directory) {
                    throw new Error('dup file')
                }
                subdir = subdir.toDirFile(stat)
                this.children.splice(index, 1 , subdir)
            }
        } else {
            const index = this.children.findIndex(x => nodeEq(x, name))
            let subdir: DirTreeNode<T>
            if (index === -1) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                subdir = new DirTreeNodeDir<T>(name, nextFullpath)
                this.children.push(subdir)
            } else {
                subdir = this.children[index]
                if (subdir.type === TreeNodeType.File) {
                    subdir = subdir.toDirFile()
                    this.children.splice(index, 1 , subdir)
                }
            }
            subdir.append(paths, stat)
        }
    }
    public change(paths: string[], stat: T): boolean {
        if (paths.length === 0) return false
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const name = paths.shift()!
        if (paths.length === 0) {
            const node = this.children.find(x => nodeEq(x, name))
            if (!node) return false
            if (!isFile(node)) return false
            node.stat = stat
            return true
        } else {
            const node = this.children.find(x => nodeEq(x, name))
            if (!node) return false
            if (!isDir(node)) return false
            return node.change(paths, stat)
        }
    }
    public remove(paths: string[]): boolean {
        if (paths.length === 0) return false
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const name = paths.shift()!
        if (paths.length === 0) {
            const index = this.children.findIndex(x => nodeEq(x, name))
            if (index === -1) return false
            const node = this.children[index]
            if (node.type === TreeNodeType.FileDirectory) {
                this.children.splice(index, 1, node.toDir())
            } else {
                this.children.splice(index, 1)
            }
            return true
        } else {
            const node = this.children.find(x => nodeEq(x, name))
            if (!node) return false
            if (!isDir(node)) return false
            return node.remove(paths)
        }
    }
}

// DirFile
export class DirTreeNodeDirFile<T> extends BaseDirTreeNodeDir<T> implements ITreeDir<T>, ITreeFile<T> {
    public type: TreeNodeType.FileDirectory
    public stat: T
    public constructor(name: string, fullPath: string, stat: T) {
        super(name, fullPath)
        this.stat = stat
        this.type = TreeNodeType.FileDirectory
    }
    public toDir(): DirTreeNodeDir<T> {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const node = new DirTreeNodeDir<T>(this.name, this.fullPath)
        node.children.push(...this.children)
        return node
    }
}

// File
export class DirTreeNodeFile<T> implements ITreeFile<T> {
    public type: TreeNodeType.File
    public fullPath: string
    public name: string
    public stat: T
    constructor(name: string, fullPath: string, stat: T) {
        this.name = name
        this.fullPath = fullPath
        this.stat = stat
        this.type = TreeNodeType.File
    }
    public toDirFile(): DirTreeNodeDirFile<T> {
        return new DirTreeNodeDirFile(this.name, this.fullPath, this.stat)
    }
}

// Directory
export class DirTreeNodeDir<T> extends BaseDirTreeNodeDir<T> implements ITreeDir<T> {
    public type: TreeNodeType.Directory
    public constructor(name: string, fullPath: string) {
        super(name, fullPath)
        this.type = TreeNodeType.Directory
    }
    public toDirFile(stat: T): DirTreeNodeDirFile<T> {
        return new DirTreeNodeDirFile(this.name, this.fullPath, stat)
    }
}

export class DirTreeRoot<T> extends DirTreeNodeDir<T> {
    public constructor(name: string, fullPath: string) {
        super(name, fullPath)
        this.root = true
    }
}

export type DirTreeNode<T> = DirTreeNodeDir<T> | DirTreeNodeFile<T> | DirTreeNodeDirFile<T>

export function isDirTreeNode<T>(node: ITreeNode<T>): node is DirTreeNode<T> {
    return node instanceof DirTreeNodeDirFile || node instanceof DirTreeNodeFile || node instanceof DirTreeNodeDir
}

export function key2paths(key: string, encode: 'base64' | 'none' = 'base64'): string[] {
    const paths = (encode === 'base64' ? decode(key) : key).split(/\//g)
    paths.shift()
    return paths
}
