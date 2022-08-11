window.SQR = window.SQR || {}

// let urlString;

SQR.reader = (() => {
    /**
     * getUserMedia()に非対応の場合は非対応の表示をする
     */
    const showUnsuportedScreen = () => {
        document.querySelector('#js-unsuwwpported').classList.add('is-show')
    }
    if (!navigator.mediaDevices) {
        showUnsuportedScreen()
        return
    }

    const video = document.querySelector('#js-video')

    /**
     * videoの出力をCanvasに描画して画像化 jsQRを使用してQR解析
     */
    const checkQRUseLibrary = () => {
        const canvas = document.querySelector('#js-canvas')
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, canvas.width, canvas.height)

        if (code) {
            SQR.modal.open(code.data)
        } else {
            setTimeout(checkQRUseLibrary, 200)
        }
    }

    /**
     * videoの出力をBarcodeDetectorを使用してQR解析
     */
    const checkQRUseBarcodeDetector = () => {
        const barcodeDetector = new BarcodeDetector()
        barcodeDetector
            .detect(video)
            .then((barcodes) => {
                if (barcodes.length > 0) {
                    for (let barcode of barcodes) {
                        SQR.modal.open(barcode.rawValue)
                    }
                } else {
                    setTimeout(checkQRUseBarcodeDetector, 200)
                }
            })
            .catch(() => {
                console.error('Barcode Detection failed, boo.')
            })
    }

    /**
     * BarcodeDetector APIを使えるかどうかで処理を分岐
     */
    const findQR = () => {
        window.BarcodeDetector
            ? checkQRUseBarcodeDetector()
            : checkQRUseLibrary()
    }

    /**
     * デバイスのカメラを起動
     */
    const initCamera = () => {
        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: {
                    facingMode: {
                        exact: 'environment',
                    },
                },
            })
            .then((stream) => {
                video.srcObject = stream
                video.onloadedmetadata = () => {
                    video.play()
                    findQR()
                }
            })
            .catch(() => {
                showUnsuportedScreen()
            })
    }

    return {
        initCamera,
        findQR,
    }
})()

SQR.modal = (() => {
    urlString = "Hello";
    let serverString = document.getElementById("server_url")
    // document.getElementById('url_id').innerHTML = urlString;

    const result = document.querySelector('#js-result')
    const send = document.querySelector('#js-send')
    const copyBtn = document.querySelector('#js-copy')
    const modal = document.querySelector('#js-modal')
    const modalClose = document.querySelector('#js-modal-close')

    /**
     * 取得した文字列を入れ込んでモーダルを開く
     */
    const open = (url) => {
        result.value = url
        send.setAttribute('href', url)
        modal.classList.add('is-show')
    }

    /**
     * モーダルを閉じてQR読み込みを再開
     */
    const close = () => {
        modal.classList.remove('is-show')
        SQR.reader.findQR()
    }

    const copyResultText = () => {
        result.select()
        document.execCommand('copy')
    }

    const sendViaSocket = () => {
        let socket = new WebSocket(serverString);
        socket.send(urlString)
    }

    send.addEventListener('click', sendViaSocket)

    copyBtn.addEventListener('click', copyResultText)

    modalClose.addEventListener('click', () => close())

    return {
        open,
    }
})()

if (SQR.reader) SQR.reader.initCamera()
