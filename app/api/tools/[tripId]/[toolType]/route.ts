import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { SqliteStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";
import { BusinessError } from "@/src/domain/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; toolType: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { tripId, toolType } = await params;
    const body = await request.json();
    const store = new SqliteStore(userId);
    const service = new TripService(store);
    const { action, ...input } = body;

    switch (action) {
      // 随机抽号
      case "publish-seat-draw":
        return NextResponse.json(service.publishSeatDrawTool(input));
      case "start-seat-draw":
        return NextResponse.json(service.startSeatDrawRound());
      case "advance-seat-draw":
        return NextResponse.json(service.advanceSeatDrawRollingFrame());
      case "finalize-seat-draw":
        return NextResponse.json(service.finalizeSeatDrawRoundIfDue());
      case "draw-seat":
        return NextResponse.json(service.drawSeat());
      case "reset-seat-draw":
        return NextResponse.json(service.resetSeatDrawTool());
      case "close-seat-draw":
        return NextResponse.json(service.closeSeatDrawTool());
      case "recreate-seat-draw":
        return NextResponse.json(service.recreateSeatDrawTool(input));

      // 投票
      case "publish-vote":
        return NextResponse.json(service.publishVoteTool(input));
      case "submit-vote":
        return NextResponse.json(service.submitVote(input));
      case "end-vote":
        return NextResponse.json(service.endVote());
      case "reset-vote":
        return NextResponse.json(service.resetVoteTool());
      case "close-vote":
        return NextResponse.json(service.closeVoteTool());
      case "recreate-vote":
        return NextResponse.json(service.recreateVoteTool(input));

      // 大转盘
      case "publish-wheel":
        return NextResponse.json(service.publishWheelTool(input));
      case "spin-wheel":
        return NextResponse.json(service.spinWheel(input));
      case "reset-wheel":
        return NextResponse.json(service.resetWheelTool());
      case "close-wheel":
        return NextResponse.json(service.closeWheelTool());
      case "recreate-wheel":
        return NextResponse.json(service.recreateWheelTool(input));

      // 幸运签
      case "publish-lottery":
        return NextResponse.json(service.publishLotteryTool(input));
      case "claim-lottery":
        return NextResponse.json(service.claimLottery(input));
      case "reset-lottery":
        return NextResponse.json(service.resetLotteryTool());
      case "close-lottery":
        return NextResponse.json(service.closeLotteryTool());
      case "recreate-lottery":
        return NextResponse.json(service.recreateLotteryTool(input));

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; toolType: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { toolType } = await params;
    const store = new SqliteStore(userId);
    const service = new TripService(store);

    const toolsPageData = service.getToolsPageData();
    return NextResponse.json(toolsPageData);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
