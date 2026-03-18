const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('nnDesigner.open', () => {

            const panel = vscode.window.createWebviewPanel(
                'nnDesigner',
                'NN Designer',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            const htmlPath = path.join(context.extensionPath, 'webview', 'index.html');
            let html = fs.readFileSync(htmlPath, 'utf8');

            // Webview 전용 URI로 변환 (여기서 수정)
            const scriptPath = panel.webview.asWebviewUri(
                vscode.Uri.file(path.join(context.extensionPath, 'webview', 'script.js'))
            );
            const stylePath = panel.webview.asWebviewUri(
                vscode.Uri.file(path.join(context.extensionPath, 'webview', 'style.css'))
            );

            html = html.replace('script.js', scriptPath);
            html = html.replace('style.css', stylePath);

            panel.webview.html = html;
        })
    );
}

module.exports = { activate };