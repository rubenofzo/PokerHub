CREATE TABLE "signups" (
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signups_session_id_player_id_pk" PRIMARY KEY("session_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "start_time" time;--> statement-breakpoint
ALTER TABLE "signups" ADD CONSTRAINT "signups_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signups" ADD CONSTRAINT "signups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;