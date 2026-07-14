import { defineEventHandler } from 'h3'
import { getLocalCrikketReports } from '~/server/utils/crikket-client'

export default defineEventHandler(async (event) => {
  try {
    const reports = getLocalCrikketReports()
    return { success: true, reports }
  } catch (error: any) {
    return { success: false, reports: [], error: error.message }
  }
})
