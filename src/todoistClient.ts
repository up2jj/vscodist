import HttpClient, { HttpResponse } from "./httpClient";
import * as child_process from 'child_process'

export interface Task {
  content: string,
  id?: number
}

export interface Comment {
  content: string
  task_id: number
}

export default class TodoistClient {
  private client: HttpClient
  private base_path: string = '/API/v8'

  constructor(api_key: string) {
    this.client = new HttpClient(api_key, "beta.todoist.com")
  }

  private buildPath(path: string): string {
    return `${this.base_path}/${path}`
  }

  public addTask(task: Task): Promise<HttpResponse> {
    return this.client.post(this.buildPath('tasks'), task)
  }

  public addCommentToTask(task: Task, comment: Comment): Promise<HttpResponse> {
    if (task.id) {
      comment.task_id = task.id
      return this.client.post(this.buildPath('comments'), comment)
    }
    return new Promise<HttpResponse>(resolve => {
      const response = new HttpResponse
      response.error = 'Task id not provided'
      resolve(response)
    })
  }

  public openAppQuickAdd(content: string): void {
    this.openApp('todoist://addtask?content=' + encodeURIComponent(content))
  }

  public openAppInbox(): void {
    this.openApp('todoist://inbox')
  }

  public openAppTeamInbox(): void {
    this.openApp('todoist://teaminbox')
  }

  public openAppNotifications(): void {
    this.openApp('todoist://notifications')
  }

  public openAppToday(): void {
    this.openApp('todoist://today')
  }

  public openAppNext7Days(): void {
    this.openApp('todoist://next7days')
  }

  public openAppProfile(): void {
    this.openApp('todoist://profile')
  }

  protected openApp(uri: string, callback?: Function): void {
    let command: string
    console.log(uri)
    switch (process.platform) {
      case 'darwin':
        command = 'open';
        break;
      case 'win32':
        command = 'explorer.exe';
        break;
      case 'linux':
        command = 'xdg-open';
        break;
      default:
        throw new Error('Unsupported platform: ' + process.platform);
    }

    let child = child_process.spawn(command, [uri])
    let errorText: string = ""
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (data) => errorText += data);
    child.stderr.on('end', () => {
      let error = new Error(errorText)
      if (callback !== undefined) {
        callback(error)
        return
      }
      throw error;
    });
  }
}