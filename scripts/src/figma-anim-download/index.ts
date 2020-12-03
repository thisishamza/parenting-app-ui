import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { File } from 'figma-types';
import fs from "fs";
import path from "path";

let FIGMA_TOKEN: string;

export type ImagesResponse = {
    err: string | null;
    images: { [key: string]: string };
};

async function downloadFile(url: string, path: string) {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}

async function figmaFetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: {
            "X-Figma-Token": FIGMA_TOKEN
        }
    });
    const body: T = await res.json();
    return body;
}

async function main() {
    const answer = await inquirer.prompt({
        type: 'password',
        message: 'Enter your figma token',
        name: 'figma_token'
    });
    FIGMA_TOKEN = answer.figma_token;

    const file = await figmaFetchJSON<File>("https://api.figma.com/v1/files/ZMFJB6uzZhLKzk93CTqCsV?depth=2");
    const page1 = file.document.children[0];
    console.log("Page 1", page1);
    const frames = page1.children;
    console.log("Frames", frames);
    const frame1 = frames[0];
    const svgResBody = await figmaFetchJSON<ImagesResponse>(`https://api.figma.com/v1/images/ZMFJB6uzZhLKzk93CTqCsV?format=svg&ids=${frame1.id}`);
    for (let nodeId in svgResBody.images) {
        const url = svgResBody.images[nodeId];
        downloadFile(url, path.join(__dirname, frame1.name + ".svg"));
    }
}
main();