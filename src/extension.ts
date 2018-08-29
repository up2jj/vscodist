import * as vscode from 'vscode'

import TodoistClient, { Task, Comment } from './todoistClient';
import { HttpResponse } from './httpClient';

export function activate(context: vscode.ExtensionContext) {

    let vscodist = new VSCodist()

    context.subscriptions.push(
        vscode.commands.registerCommand('vscodist.apikey', async (args) => {
            const apiKey: string | undefined = await vscodist.promptForApiKey()
            if (apiKey === undefined) {
                vscode.window.showErrorMessage("Todoist API key has not been saved. Key is invalid.", ...new Array("Retry")).then(result => {
                    if (result === 'Retry')
                        vscode.commands.executeCommand('vscodist.apikey')
                    else
                        vscode.window.showErrorMessage("Configuration aborted.")
                })
            }
            else {
                vscodist.updateKey('apiKey', apiKey)
                vscodist.setupClient(apiKey)
            }
        }),
        vscode.commands.registerCommand('vscodist.addTask', async (args) => vscodist.addTask()),
        vscode.commands.registerCommand('vscodist.appQuickAdd', (args) => vscodist.appQuickAdd()),
        vscode.commands.registerCommand('vscodist.appOpenInbox', (args) => vscodist.appOpenInbox())
    )

    if (vscodist.getApiKey() === undefined) {
        vscode.window.showInformationMessage("Todoist API key has not been set. Would you like to set it now?", ...new Array("Yes", "No"))
            .then((result) => {
                if (result === "Yes")
                    vscode.commands.executeCommand('vscodist.apikey')
            })
    }
}

export function deactivate() {
}


export class VSCodist {

    private todoistClient: TodoistClient | null = null

    constructor() {
        const key = this.getApiKey()
        if (key !== undefined) {
            this.setupClient(key)
        }
    }

    public setupClient(key: string): void {
        this.todoistClient = new TodoistClient(key)
    }

    public async promptForApiKey(): Promise<string | undefined> {
        return vscode.window.showInputBox({ prompt: 'Provide Todoist API Key' });
    }

    public async updateKey(key: string, value: any) {
        console.log(value)
        let settings_target: vscode.ConfigurationTarget
        if (vscode.workspace.workspaceFolders) {
            settings_target = vscode.ConfigurationTarget.Workspace
        }
        else {
            settings_target = vscode.ConfigurationTarget.Global
        }

        if (key === undefined || key === '') {
            vscode.window.showErrorMessage("Todoist API key has not been saved")
            return
        }
        await vscode.workspace.getConfiguration('vscodist').update(key, value, settings_target)
        vscode.window.showInformationMessage('Todoist API key has been saved');
    }

    public getConfigurationKey(key: string) {
        return vscode.workspace.getConfiguration('vscodist', null).get(key)
    }

    public hasApiKey(): boolean {
        const api_key = vscode.workspace.getConfiguration('vscodist', null).get<string>('apiKey')
        return api_key !== undefined && api_key !== ''
    }

    public getApiKey(): string | undefined {
        const api_key = vscode.workspace.getConfiguration('vscodist', null).get<string>('apiKey')
        if (api_key === '' || api_key === undefined)
            return undefined
        return api_key
    }

    public getReference(): string {
        if (!vscode.window.activeTextEditor) {
            return ''
        }
        let uri: string = vscode.window.activeTextEditor.document.uri.toString()
        const line: number = vscode.window.activeTextEditor.selection.active.line + 1

        uri = uri.replace('file://', 'vscode://file')

        return uri + ':' + line.toString()

    }

    public concatenateSelections(document: vscode.TextDocument, selections: vscode.Selection[]): string {
        let txt: string[] = selections.map((selection: vscode.Selection) => {
            return document.getText(new vscode.Range(selection.start, selection.end))
        })

        return txt.join(' ')
    }

    public getTaskContent(document: vscode.TextDocument, selections: vscode.Selection[]): string {
        let content: string = ""
        if (selections.length === 0) {
            content = this.getReference()
        }
        else {
            content = this.concatenateSelections(document, selections)
            if (content === '')
                content = this.getReference()
        }
        return content
    }

    public async addTask() {

        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage('Open a file first to manipulate text selections');
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        let selections = editor.selections;

        console.log(this.getTaskContent(doc, selections))
        const task: Task = {
            content: this.getTaskContent(doc, selections)
        }
        const taskResult: HttpResponse = await this.todoistClient!.addTask(task)
        if (taskResult.isFailed) {
            vscode.window.showErrorMessage("Task has not been added")
            return
        }
        vscode.window.showInformationMessage("Task added")
        const currentReference: string = this.getReference()
        const createdTask: Task | undefined = taskResult.response<Task>()
        if (taskResult.isOk && createdTask && currentReference !== '') {
            const comment: Comment = {
                content: currentReference,
                task_id: createdTask.id!
            }
            const commentResult: HttpResponse = await this.todoistClient!.addCommentToTask(createdTask, comment)
            if (commentResult.isOk)
                vscode.window.showInformationMessage("Comment with reference has been added")
            if (commentResult.isFailed)
                vscode.window.showErrorMessage("Comment with reference has not been added")
        }
    }

    public appQuickAdd(): void {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage('Open a file first to manipulate text selections');
            return;
        }

        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        let selections = editor.selections;

        let content: string = this.getTaskContent(doc, selections)
        this.todoistClient!.openAppQuickAdd(content)
    }

    public appOpenInbox(): void {
        this.todoistClient!.openAppInbox()
    }



}