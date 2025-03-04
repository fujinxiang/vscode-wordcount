// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, Position} from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Wordcount" is now active!');

    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(wordCounter);
}

export class WordCounter {

    private _statusBarItem: StatusBarItem;

    public updateWordCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        // Only update status if an MD file
        if (doc.languageId === "markdown") {
            let wordCount = this._getWordCount(doc, editor.selection.active);

            // Update the status bar
            this._statusBarItem.text = `$(pencil) ${wordCount} Words`;
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument, position: Position): string {
        let docContent = doc.getText();
        let lines = docContent.split('\n');
        let currentLine = position.line;

        // Find the start of the current paragraph
        let startLine = currentLine;
        while (startLine > 0 && !lines[startLine].startsWith('#')) {
            startLine--;
        }

        // Find the end of the current paragraph
        let endLine = currentLine+1;
        while (endLine < lines.length && !lines[endLine].startsWith('#')) {
            endLine++;
        }

        // Get the content of the current paragraph
        let paragraph = lines.slice(startLine, endLine).join(' ');

        // 过滤中文标点、换行符和空格
        let reg = /[\u4e00-\u9fa5]/g;
        let matches = paragraph.match(reg);
        let allMathces = docContent.match(reg);

        return `${matches ? 'c:'+matches.length : ''} ${allMathces ? 'a:'+allMathces.length : ''}`;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
