import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"

import { useMessage } from "@plasmohq/messaging/hook"
import { useStorage } from "@plasmohq/storage/hook"

import { addCss, saveHtml, saveMarkdown, setIcon } from "~tools"
import useCssCodeHook from "~utils/cssCodeHook"
import { useContent } from "~utils/editMarkdownHook"
import Turndown from "~utils/turndown"

export const config: PlasmoCSConfig = {
  matches: ["https://*.zhihu.com/*"]
}

const turndownService = Turndown()
const articleTitle = document.querySelector<HTMLElement>("head title").innerText

export default function zhihu() {
  const [cssCode, runCss] = useCssCodeHook("zhihu")
  const [closeLoginModal] = useStorage<boolean>("zhihu-closeLoginModal")
  const [autoOpenCode] = useStorage<boolean>("zhihu-autoOpenCode")
  const [history, setHistory] = useStorage<any[]>("codebox-history")
  const [closeLog] = useStorage("config-closeLog", true)
  const [content, setContent] = useContent()

  useEffect(() => {
    closeLog || console.log("zhihu status", { closeLoginModal, autoOpenCode })
    closeLoginModal && closeLoginModalFunc()
    autoOpenCode && autoOpenCodeFunc()
    setIcon(true)
  }, [closeLoginModal, autoOpenCode])

  useMessage(async (req, res) => {
    if (req.name == "zhihu-isShow") {
      res.send({ isShow: true })
    }
    if (req.name == "zhihu-editMarkdown") {
      setContent("article.Post-Main")
    }
    if (req.name == "zhihu-downloadMarkdown") {
      downloadMarkdown()
    }
    if (req.name == "zhihu-downloadHtml") {
      downloadHtml()
    }
  })

  // 隐藏登录弹窗
  function closeLoginModalFunc() {
    addCss(`
    .Modal-wrapper--transparent,
    .Modal-enter-done{
      display:none !important;
    }`)
    const element = document.querySelector("html")
    element.style.overflow = "auto"
    element.style.margin = "0px"
  }

  // 自动展开全文
  function autoOpenCodeFunc() {
    removeExpandButton()
    removeRichContentCollapsed()
    addCss(`
    .RichContent--unescapable.is-collapsed .RichContent-inner {
      max-height: unset !important;
      mask-image: unset !important;
    }
    .RichContent--unescapable.is-collapsed .ContentItem-rightButton {
      display:none !important;
    }`)
  }

  function removeExpandButton(element?) {
    element || (element = document)
    const expandButtons = element.querySelectorAll(".ContentItem-expandButton")
    if (expandButtons.length) {
      expandButtons.forEach((button) => {
        const parent = button.parentElement
        if (!element.classList) {
          if (parent.classList.contains("RichContent")) {
            const collapsed = parent.querySelector(
              ".RichContent-inner--collapsed"
            )
            collapsed && (collapsed.style.maxHeight = "unset")
            removeExpandButton(parent)
          } else {
            parent.style.display = "none"
          }
        }
        button.style.display = "none"
      })
    }
  }

  function removeRichContentCollapsed() {
    const isCollapseds = document.querySelectorAll(".RichContent.is-collapsed")
    if (isCollapseds.length > 0) {
      isCollapseds.forEach((isCollapsed) => {
        isCollapsed.classList.remove("is-collapsed")
      })
    }
  }

  function downloadMarkdown() {
    const html = document.querySelector("article.Post-Main")
    const markdown = turndownService.turndown(html)
    saveMarkdown(markdown, articleTitle)
  }

  function downloadHtml() {
    const dom = document.querySelector("article.Post-Main")
    saveHtml(dom, articleTitle)
  }

  return <div style={{ display: "none" }}></div>
}
