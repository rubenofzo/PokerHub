CREATE TABLE "player_aliases" (
	"alias" text PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name"),
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"money_in_cents" integer NOT NULL,
	"money_out_cents" integer NOT NULL,
	"buy_ins" integer,
	CONSTRAINT "results_session_id_player_id_pk" PRIMARY KEY("session_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"source_filename" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_aliases" ADD CONSTRAINT "player_aliases_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;