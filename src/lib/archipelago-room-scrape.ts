import axios from 'axios'
import { parse } from 'node-html-parser'
import { ArchipelagoRoomData, ArchipelagoRoomUrl } from '../types/archipelago-types'

const ARCHIPELAGO_ROOM_REGEX = /^(http(s)?:\/\/)?archipelago.gg\/room\/[A-Za-z0-9\-_]{22}$/
const PORT_CAPTURE_REGEX = /archipelago\.gg:([0-9]{4,5})/

export function parseArchipelagoRoomUrl(url: string) : ArchipelagoRoomUrl | null {
  const regexResult = ARCHIPELAGO_ROOM_REGEX.exec(url)
  if (regexResult === null) return null;
  return { url: regexResult[0] }
}

async function getRoomPageDom(url: string) {
  const res = await axios.get(url)
  if (res.status !== 200) throw new Error('Room fetch had unsuccessful HTTP status.')
  const dom = parse(res.data)
  return dom
}

export async function getRoomData(archRoomUrl: ArchipelagoRoomUrl): ArchipelagoRoomData {
  const dom = await getRoomPageDom(archRoomUrl.url)
  const hostRoomInfo = dom.getElementById('host-room-info')
  if (hostRoomInfo === undefined)
    throw new Error('DOM retrieved had unexpected format: id="host-room-info" not found.')
  const capture = PORT_CAPTURE_REGEX.exec(hostRoomInfo?.innerText)
  if (capture === null || capture.length != 2)
    throw new Error('DOM retrieved had unexpected format: Could not get port.')
  const port = capture[1]
  const playerTable = dom.getElementById('slots-table')
  const tableRows = playerTable?.lastElementChild?.children
  if (tableRows === undefined)
    throw new Error('DOM retrieved had unexpected format: Slots table not found or malformed.')
  const roomData: ArchipelagoRoomData = []
  for (const row of tableRows) {
    const columns = row.children
    if (columns.length !== 5)
      throw new Error(`DOM table rows had unexpected format: Expected 5 columns but got ${columns.length}.`)
    const id = columns[0].textContent
    const name = columns[1].firstElementChild?.textContent
    if (name === undefined)
      throw new Error('DOM table rows had unexpected format: Missing name.')
    const game = columns[2].textContent
    const downloadLink = (() => {
      const possibleAnchor = columns[3].firstElementChild
      if (possibleAnchor === undefined) return null;
      const path = possibleAnchor.attributes['href']
      if (path === undefined) return null
      return `https://archipelago.gg${path}`
    })()
    const trackerPath = columns[4].firstElementChild?.attributes['href']
    if (trackerPath === undefined)
      throw new Error('DOM table rows had unexpected format: Missing tracker page.')
    const trackerPage = `https://archipelago.gg${trackerPath}`
    roomData.push({ id, name, game, downloadLink, trackerPage })
  }
  return {
    players: roomData,
    port,
    roomUrl: archRoomUrl.url,
  }
}
