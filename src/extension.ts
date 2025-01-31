import Ollama from "ollama";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        "deepseeklocal.helloWorld",
        () => {
            const panel = vscode.window.createWebviewPanel(
                "DeepSeek Local",
                "DeepSeek Chat",
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = getWebviewContent();

            panel.webview.onDidReceiveMessage(async (message: any) => {
                if (message.command === "chat") {
                    const userPrompt = message.text;
                    let responseText = "";

                    try {
                        const streamResponse = await Ollama.chat({
                            model: "deepseek-r1:8b",
                            messages: [{ role: "user", content: userPrompt }],
                            stream: true,
                        });
                        for await (const part of streamResponse) {
                            responseText += part.message.content;
                        }
                        panel.webview.postMessage({
                            command: "chatResponse",
                            text: responseText,
                        });
                    } catch (err: any) {
                        panel.webview.postMessage({
                            command: "chatResponse",
                            text: "Error: " + err.message,
                        });
                    }
                }
            });
        }
    );

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>DeepSeek Chat</title>
        <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css">
    </head>
    <body style="background-color:#00061f; color: #e8e8e8;">

        <h2 style="margin: 20px;">How can I help you today?</h2>
        
        <div id="response" style="height: calc(100vh - 230px); overflow-y: auto; padding: 0 20px;"></div>

        <div style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 15px; display: flex; gap: 15px; align-items: center; width: 70%; max-width: 650px; background-color: #00061f;">

            <textarea id="prompt" style="flex: 1; height: 60px; resize: none; padding: 12px; font-size: 16px; border-radius: 8px; background-color: #2c2f36; color: #e8e8e8;"></textarea>

            <button id="submit" style="height: 40px; padding: 0 25px; font-size: 12px; cursor: pointer; border: none; background-color: #2c2f36; color: #e8e8e8; border-radius: 20px;">Send</button>

        </div>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('submit').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text });
            });
            
            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    const container = document.getElementById('response');
                    const newDiv = document.createElement('div');
                    newDiv.innerText = text;
                    container.appendChild(newDiv);

                    const hr = document.createElement('hr');
                    container.appendChild(hr);
                }
            });
        </script>
    </body>
    </html>
    `;
}

export function deactivate() {}
