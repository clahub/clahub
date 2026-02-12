import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),
});

export function parsePagination(request: NextRequest) {
  const url = new URL(request.url);
  const raw = {
    page: url.searchParams.get("page") ?? undefined,
    per_page: url.searchParams.get("per_page") ?? undefined,
  };
  return paginationSchema.parse(raw);
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
  request: NextRequest,
) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const url = new URL(request.url);

  const links: string[] = [];
  const makeLink = (p: number, rel: string) => {
    url.searchParams.set("page", String(p));
    url.searchParams.set("per_page", String(perPage));
    links.push(`<${url.toString()}>; rel="${rel}"`);
  };

  makeLink(1, "first");
  makeLink(totalPages, "last");
  if (page > 1) makeLink(page - 1, "prev");
  if (page < totalPages) makeLink(page + 1, "next");

  return NextResponse.json(
    {
      data,
      pagination: { page, per_page: perPage, total, total_pages: totalPages },
    },
    {
      headers: {
        Link: links.join(", "),
        "X-Total-Count": String(total),
        "X-Total-Pages": String(totalPages),
      },
    },
  );
}
