export class FileLoader {
    protected static onProgress: (loaded_bytes: number, total_bytes: number, file_name: string) => void = () => {
    };

    protected static onFileComplete: (file_name: string) => void = () => {
    };

    static async promiseAll(files: string[], base_url: string = ""): Promise<Response[] | any[]> {
        let promises: Promise<Response>[] = [];
        for (let file of files) {
            let p = FileLoader.promise(file, base_url);
            promises.push(p);
        }
        return Promise.all(promises);
    }

    static async promise(
        file_name: string,
        base_url: string = window.location.href.substr(0, window.location.href.lastIndexOf("/"))
    ): Promise<Response | any> {
        if (!base_url.endsWith("/")) base_url += "/";
        return fetch(base_url + file_name)
            .then(response => {
                if (!response.ok) throw new Error(response.status + " " + response.statusText);

                const contentLength = response.headers.get("content-length");
                if (!contentLength) throw new Error("Content-Length response header unavailable");

                const total = parseInt(contentLength, 10);
                if (response.body && ReadableStream)
                    return FileLoader.readAllChunks(response.body, total, file_name);
                else return response;
            })
            .then(response => {
                this.onFileComplete(file_name);
                return response;
            });
    }

    static setOnProgress(f: (loaded_bytes: number, total_bytes: number, file_name: string) => void): void {
        this.onProgress = (loaded_bytes: number, total_bytes: number, file_name: string) => {
            try {
                f(loaded_bytes, total_bytes, file_name);
            } catch (e) {
                console.error(e);
            }
        };
    }

    static setOnFileComplete(f: (file_name: string) => void): void {
        this.onFileComplete = (file_name: string) => {
            try {
                f(file_name);
            } catch (e) {
                console.error(e);
            }
        };
    }

    private static readAllChunks(readableStream: ReadableStream, total_size: number, file_name: string): Response {
        let loaded = 0;
        const reader = readableStream.getReader();
        let stream = new ReadableStream({
            async start(controller: ReadableStreamDefaultController): Promise<void> {
                //Pump the whole file
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) {
                        break;
                    }
                    loaded += value.byteLength;
                    //Notify caller of progress
                    FileLoader.onProgress(loaded, total_size, file_name);
                    controller.enqueue(value);
                }
                controller.close();
                reader.releaseLock();
            },
        });
        return new Response(stream, {});
    }
}
