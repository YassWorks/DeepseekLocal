import Ollama from 'ollama';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('deepseeklocal.helloWorld', () => {
        const panel = vscode.window.createWebviewPanel(
            'DeepSeek Local',
            'DeepSeek Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';

                try {
                    const streamResponse = await Ollama.chat({
                        model: 'deepseek-r1:8b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                } catch (err: any) {
                    panel.webview.postMessage({ command: 'chatResponse', text: 'Error: ' + err.message });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            body { font-family: sans-serif; margin: 1rem; }
            #prompt { width: 100%; box-sizing: border-box; }
            #response { border: 1px solid #ccc; padding: 1rem; margin-top: 1rem; }
        </style>
    </head>
    <body>
        <h2>DeepSeekLocal Extension</h2>
        <textarea id="prompt" rows="3" placeholder="Enter your prompt."></textarea>
        <button id="submit">Submit</button>
        <div id="response"></div>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('submit').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text });
            });
            
            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    document.getElementById('response').innerText = text;
                }
            });
        </script>
    </body>
    </html>
    `;
}

export function deactivate() {}